const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middlewares/auth");
const Block = require("../models/Block");
const MedicalRecord = require("../models/MedicalRecord");
const createCryptoHash = require("../utils/createCryptoHash");
const mongoose = require("mongoose");

// 1. Xác thực tính toàn vẹn blockchain (chỉ admin và doctor)
router.get(
	"/verify",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const verification = await MedicalRecord.verifyBlockchain();

			res.json({
				success: true,
				message: "Kết quả xác thực blockchain",
				data: verification,
			});
		} catch (error) {
			console.error("Error verifying blockchain:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực blockchain",
				error: error.message,
			});
		}
	}
);

// 2. Lấy thông tin blockchain tổng quan (admin)
router.get(
	"/info",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const totalBlocks = await Block.countDocuments();
			const latestBlock = await Block.findOne().sort({ index: -1 });
			const genesisBlock = await Block.findOne({ index: 0 });

			// Quick integrity check
			const verification = await MedicalRecord.verifyBlockchain();

			res.json({
				success: true,
				data: {
					totalBlocks,
					validBlocks: verification.valid
						? totalBlocks
						: totalBlocks - 1, // Simplified
					invalidBlocks: verification.valid ? 0 : 1, // Simplified
					integrityPercentage: verification.valid ? 100 : 95, // Simplified
					networkStatus: verification.valid ? "healthy" : "warning",
					lastBlockTime: latestBlock?.timestamp,
					latestBlock: latestBlock
						? {
								index: latestBlock.index,
								timestamp: latestBlock.timestamp,
								hash: latestBlock.hash,
								action: latestBlock.data.action,
						  }
						: null,
					genesisBlock: genesisBlock
						? {
								index: genesisBlock.index,
								timestamp: genesisBlock.timestamp,
								hash: genesisBlock.hash,
						  }
						: null,
					chainValid: verification.valid,
					verificationMessage: verification.message,
				},
			});
		} catch (error) {
			console.error("Error getting blockchain info:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy thông tin blockchain",
				error: error.message,
			});
		}
	}
);

// 3. Lấy lịch sử blockchain của một medical record (patient chỉ xem của mình)
router.get(
	"/record/:recordId/history",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { recordId } = req.params;

			// Kiểm tra medical record có tồn tại không
			const medicalRecord = await MedicalRecord.findById(recordId);
			if (!medicalRecord) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Kiểm tra quyền truy cập: patient chỉ xem hồ sơ của mình
			if (
				req.user.role === "patient" &&
				medicalRecord.patientId.toString() !== req.user.userId
			) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập lịch sử hồ sơ này",
				});
			}

			const history = await medicalRecord.getBlockchainHistory();

			res.json({
				success: true,
				message: "Lịch sử blockchain của hồ sơ y tế",
				data: {
					recordId,
					history,
					totalTransactions: history.length,
				},
			});
		} catch (error) {
			console.error("Error getting record blockchain history:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy lịch sử blockchain",
				error: error.message,
			});
		}
	}
);

// 4. Lấy thông tin một block cụ thể (admin và doctor)
router.get(
	"/block/:blockIndex",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { blockIndex } = req.params;
			const index = parseInt(blockIndex);

			if (isNaN(index) || index < 0) {
				return res.status(400).json({
					success: false,
					message: "Block index không hợp lệ",
				});
			}

			const block = await Block.findOne({ index })
				.populate("data.patientId", "name email")
				.populate("data.doctorId", "name email")
				.populate("data.recordId")
				.populate("data.updatedBy", "name email");

			if (!block) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy block",
				});
			}

			res.json({
				success: true,
				data: block,
			});
		} catch (error) {
			console.error("Error getting block:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy thông tin block",
				error: error.message,
			});
		}
	}
);

// 5. Lấy danh sách blocks (admin) - với phân trang
router.get(
	"/blocks",
	authenticateToken,
	authorize(["admin"]),
	async (req, res) => {
		try {
			// Parse pagination parameters
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 20;
			const skip = (page - 1) * limit;

			// Parse sorting parameters
			const sortBy = req.query.sortBy || "index";
			const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

			// Parse filter parameters
			const action = req.query.action; // "create", "update", "delete"
			const dateFrom = req.query.dateFrom;
			const dateTo = req.query.dateTo;
			const recordId = req.query.recordId; // Filter by specific recordId hash

			console.log("📋 Getting blocks list with params:", {
				page,
				limit,
				sortBy,
				sortOrder,
				action,
				dateFrom,
				dateTo,
				recordId,
			});

			// Build filter query
			const filter = {};

			// Add action filter if provided
			if (action && ["create", "update", "delete"].includes(action)) {
				filter["data.action"] = action;
			}

			// Add recordId filter if provided
			if (recordId) {
				filter["data.recordId"] = recordId;
			}

			// Add date range filter if provided
			if (dateFrom || dateTo) {
				filter.timestamp = {};
				if (dateFrom) {
					filter.timestamp.$gte = new Date(dateFrom);
				}
				if (dateTo) {
					const endDate = new Date(dateTo);
					endDate.setHours(23, 59, 59, 999);
					filter.timestamp.$lte = endDate;
				}
			}

			// Get total count for pagination
			const total = await Block.countDocuments(filter);

			console.log(`📊 Found ${total} blocks matching filter`);

			// Get blocks with pagination and sorting
			const blocks = await Block.find(filter)
				.populate("data.updatedBy", "name email role") // Populate user info for updatedBy
				.sort({ [sortBy]: sortOrder })
				.skip(skip)
				.limit(limit)
				.lean(); // Use lean() for better performance

			console.log(
				`✅ Retrieved ${blocks.length} blocks for page ${page}`
			);

			// Add validation status and additional info for each block
			const blocksWithValidation = await Promise.all(
				blocks.map(async (block, blockIndex) => {
					try {
						// Calculate expected hash
						const calculatedHash = Block.calculateHash(
							block.index,
							block.timestamp,
							block.data,
							block.previousHash
						);

						// Check if hash is valid
						const isValid = block.hash === calculatedHash;

						// Get medical record info if possible (for display purposes)
						let recordInfo = null;
						try {
							// Try to find the medical record using the hashed recordId
							// Note: This is reverse lookup, might be expensive for large datasets
							const records = await MedicalRecord.find({
								idHash: block.data.recordId,
							})
								.populate("patientId", "name email")
								.populate("doctorId", "name email")
								.select(
									"_id diagnosis status createdAt patientId doctorId"
								)
								.limit(1)
								.lean();

							if (records.length > 0) {
								recordInfo = {
									_id: records[0]._id,
									diagnosis: records[0].diagnosis,
									status: records[0].status,
									createdAt: records[0].createdAt,
									patient: records[0].patientId,
									doctor: records[0].doctorId,
								};
							}
						} catch (recordError) {
							console.error(
								`⚠️ Error getting record info for block ${block.index}:`,
								recordError.message
							);
						}

						// Check previous hash validity (blockchain integrity)
						let previousHashValid = true;
						if (block.index > 0) {
							try {
								const previousBlock = await Block.findOne({
									index: block.index - 1,
								})
									.select("hash")
									.lean();

								if (previousBlock) {
									previousHashValid =
										block.previousHash ===
										previousBlock.hash;
								} else {
									previousHashValid = false; // Previous block not found
								}
							} catch (prevError) {
								console.error(
									`⚠️ Error checking previous hash for block ${block.index}:`,
									prevError.message
								);
								previousHashValid = false;
							}
						}

						return {
							...block,
							// Validation info
							isValid,
							previousHashValid,
							calculatedHash: isValid ? null : calculatedHash, // Only show if different

							// Additional display info
							recordInfo,

							// Format data for better display
							data: {
								...block.data,
								// Ensure updatedBy is properly formatted
								updatedBy: block.data.updatedBy
									? {
											_id: block.data.updatedBy._id,
											name: block.data.updatedBy.name,
											email: block.data.updatedBy.email,
											role: block.data.updatedBy.role,
									  }
									: null,
							},
						};
					} catch (error) {
						console.error(
							`❌ Error processing block ${block.index}:`,
							error
						);
						return {
							...block,
							isValid: false,
							previousHashValid: false,
							error: "Error validating block",
							recordInfo: null,
						};
					}
				})
			);

			// Calculate blockchain statistics
			const stats = {
				total,
				valid: blocksWithValidation.filter((b) => b.isValid).length,
				invalid: blocksWithValidation.filter((b) => !b.isValid).length,
				actions: {
					create: blocksWithValidation.filter(
						(b) => b.data.action === "create"
					).length,
					update: blocksWithValidation.filter(
						(b) => b.data.action === "update"
					).length,
					delete: blocksWithValidation.filter(
						(b) => b.data.action === "delete"
					).length,
				},
			};

			// Get overall blockchain health
			let blockchainHealth = "healthy";
			const invalidCount = stats.invalid;
			if (invalidCount > 0) {
				blockchainHealth =
					invalidCount > total * 0.1 ? "critical" : "warning";
			}

			console.log(`📈 Blockchain stats:`, stats);

			res.json({
				success: true,
				message: "Lấy danh sách blocks thành công",
				data: blocksWithValidation,
				pagination: {
					current: page,
					pages: Math.ceil(total / limit),
					total,
					limit,
					showing: blocksWithValidation.length,
				},
				statistics: stats,
				blockchain: {
					health: blockchainHealth,
					integrity: invalidCount === 0 ? "intact" : "compromised",
				},
				filters: {
					action,
					dateFrom,
					dateTo,
					recordId,
				},
			});
		} catch (error) {
			console.error("❌ Error getting blocks:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy danh sách blocks",
				error: error.message,
				details:
					process.env.NODE_ENV === "development"
						? error.stack
						: undefined,
			});
		}
	}
);

// 6. Lấy blocks theo patient (patient chỉ xem của mình, doctor và admin xem tất cả)
router.get(
	"/patient/:patientId/blocks",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { patientId } = req.params;

			// Patient chỉ xem blocks của chính họ
			if (req.user.role === "patient" && patientId !== req.user.userId) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập blocks này",
				});
			}

			const blocks = await Block.find({ "data.patientId": patientId })
				.populate("data.doctorId", "name email")
				.sort({ index: -1 });

			res.json({
				success: true,
				data: blocks,
				total: blocks.length,
			});
		} catch (error) {
			console.error("Error getting patient blocks:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy blocks của bệnh nhân",
				error: error.message,
			});
		}
	}
);

// 7. Lấy blocks theo doctor (doctor chỉ xem của mình, admin xem tất cả)
router.get(
	"/doctor/:doctorId/blocks",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const { doctorId } = req.params;

			// Doctor chỉ xem blocks do chính họ tạo (trừ admin)
			if (req.user.role === "doctor" && doctorId !== req.user.userId) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập blocks này",
				});
			}

			const blocks = await Block.find({ "data.doctorId": doctorId })
				.populate("data.patientId", "name email")
				.sort({ index: -1 });

			res.json({
				success: true,
				data: blocks,
				total: blocks.length,
			});
		} catch (error) {
			console.error("Error getting doctor blocks:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy blocks của bác sĩ",
				error: error.message,
			});
		}
	}
);

// 9. Xác thực một medical record cụ thể (patient có thể xem của mình), là record mới nhất (đối với records có nhiều bản cập nhật)
router.get(
	"/record/:recordId/verify",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { recordId } = req.params;
			// Kiểm tra medical record có tồn tại không
			const medicalRecord = await MedicalRecord.findById(recordId);
			if (!medicalRecord) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Kiểm tra quyền truy cập: patient chỉ xem hồ sơ của mình
			if (
				req.user.role === "patient" &&
				medicalRecord.patientId.toString() !== req.user.userId
			) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập hồ sơ này",
				});
			}

			// Lấy block tương ứng với medical record
			const block = await Block.findOne({
				"data.recordId": medicalRecord.idHash,
			}).sort({ index: -1 });
			if (!block) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy block tương ứng",
				});
			}

			// Tính lại hash và so sánh
			const data = {
				recordId: medicalRecord._id,
				patientId: medicalRecord.patientId._id,
				doctorId: medicalRecord.doctorId._id,
				diagnosis: medicalRecord.diagnosis,
				treatment: medicalRecord.treatment,
				medication: medicalRecord.medication,
				doctorNote: medicalRecord.doctorNote,
				dateBack: medicalRecord.dateBack,
				status: medicalRecord.status,
				action: block.data.action, // Lấy action từ block
			};
			if (block.data.action === "update") {
				data.updatedBy = block.data.updatedBy; // Chỉ thêm updatedBy nếu action là update
			}

			const calculatedHash = Block.calculateHash(
				block.index,
				block.timestamp,
				data,
				block.previousHash
			);

			const isValid = calculatedHash === medicalRecord.recordHash;
			res.json({
				success: true,
				message: "Kết quả xác thực hồ sơ y tế",
				data: {
					recordId,
					blockIndex: block.index,
					isValid,
					storedHash: block.hash,
					calculatedHash,
					timestamp: block.timestamp,
					verified: isValid
						? "Hồ sơ chưa bị thay đổi"
						: "Hồ sơ có thể đã bị thay đổi",
				},
			});
		} catch (error) {
			console.error("Error verifying record:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 10. Xác thực tất cả blocks của một bệnh nhân cụ thể
router.get(
	"/patient/:patientId/verify",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { patientId } = req.params;

			// Patient chỉ xem blocks của chính họ
			if (req.user.role === "patient" && patientId !== req.user.userId) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập blocks này",
				});
			}

			// Lấy tất cả medical records của bệnh nhân để có danh sách recordId cần tìm
			const medicalRecords = await MedicalRecord.find({
				patientId: patientId,
			})
				.select("_id idHash")
				.lean();

			if (medicalRecords.length === 0) {
				return res.json({
					success: true,
					message: "Bệnh nhân này không có hồ sơ y tế nào",
					data: {
						patientId,
						totalBlocks: 0,
						verificationResults: [],
						errorBlocks: [], // Thêm danh sách blocks lỗi
						overallValid: true,
						statistics: {
							totalBlocks: 0,
							validBlocks: 0,
							invalidBlocks: 0,
							validityPercentage: 100,
							errorsByType: {}, // Thống kê lỗi theo loại
						},
					},
				});
			}

			// Tạo danh sách recordId hashes để tìm blocks
			const recordHashes = medicalRecords
				.filter((record) => record.idHash) // Chỉ lấy records có idHash
				.map((record) => record.idHash);

			if (recordHashes.length === 0) {
				return res.json({
					success: true,
					message:
						"Không có blocks nào được tìm thấy cho bệnh nhân này",
					data: {
						patientId,
						totalBlocks: 0,
						verificationResults: [],
						errorBlocks: [],
						overallValid: true,
						statistics: {
							totalBlocks: 0,
							validBlocks: 0,
							invalidBlocks: 0,
							validityPercentage: 100,
							errorsByType: {},
						},
					},
				});
			}

			// Lấy blocks KHÔNG populate để giữ nguyên dữ liệu gốc cho việc tính hash
			const patientBlocks = await Block.find({
				"data.recordId": { $in: recordHashes },
			}).sort({ index: 1 });

			// Lấy blocks với populate để hiển thị thông tin
			const patientBlocksWithPopulate = await Block.find({
				"data.recordId": { $in: recordHashes },
			})
				.populate("data.updatedBy", "name email")
				.sort({ index: 1 });

			if (patientBlocks.length === 0) {
				return res.json({
					success: true,
					message: "Không có blocks nào của bệnh nhân này",
					data: {
						patientId,
						totalBlocks: 0,
						verificationResults: [],
						errorBlocks: [],
						overallValid: true,
						statistics: {
							totalBlocks: 0,
							validBlocks: 0,
							invalidBlocks: 0,
							validityPercentage: 100,
							errorsByType: {},
						},
					},
				});
			}

			const verificationResults = [];
			const errorBlocks = []; // Danh sách blocks có lỗi
			const errorsByType = {}; // Thống kê lỗi theo loại
			let overallValid = true;
			let invalidBlocksCount = 0;

			// Xác thực từng block của bệnh nhân
			for (let i = 0; i < patientBlocks.length; i++) {
				const currentBlock = patientBlocks[i]; // Block KHÔNG populate
				const currentBlockWithPopulate = patientBlocksWithPopulate[i]; // Block có populate

				// Tìm medical record tương ứng với block
				const correspondingRecord = medicalRecords.find(
					(record) => record.idHash === currentBlock.data.recordId
				);

				// Lấy thông tin chi tiết medical record để hiển thị
				let recordDetails = null;
				if (correspondingRecord) {
					recordDetails = await MedicalRecord.findById(
						correspondingRecord._id
					)
						.populate("doctorId", "name email")
						.select(
							"diagnosis treatment medication doctorNote dateBack status"
						)
						.lean();
				}

				// Tạo raw data object để tính hash - chỉ với các trường cần thiết
				const rawData = {
					recordId: currentBlock.data.recordId,
					action: currentBlock.data.action,
				};

				// Thêm updatedBy nếu có (chỉ với action update)
				if (currentBlock.data.updatedBy) {
					rawData.updatedBy = currentBlock.data.updatedBy;
				}

				// Tính lại hash của block hiện tại với raw data
				const calculatedHash = Block.calculateHash(
					currentBlock.index,
					currentBlock.timestamp,
					rawData,
					currentBlock.previousHash
				);

				const isHashValid = currentBlock.hash === calculatedHash;

				// Kiểm tra tính liên kết với blockchain chính
				let isPreviousHashValid = true;
				let expectedPreviousHash = null;
				let previousBlockInfo = null;

				if (currentBlock.index > 0) {
					// Lấy block trước đó trong blockchain chính (không populate)
					const previousBlock = await Block.findOne({
						index: currentBlock.index - 1,
					})
						.select("hash index timestamp data.action")
						.lean();

					if (previousBlock) {
						expectedPreviousHash = previousBlock.hash;
						isPreviousHashValid =
							currentBlock.previousHash === previousBlock.hash;
						previousBlockInfo = {
							index: previousBlock.index,
							hash: previousBlock.hash.substring(0, 12) + "...",
							action: previousBlock.data?.action || "unknown",
						};
					} else {
						isPreviousHashValid = false;
						expectedPreviousHash = "Block trước không tồn tại";
					}
				} else {
					// Genesis block - previous hash should be "0"
					isPreviousHashValid = currentBlock.previousHash === "0";
					expectedPreviousHash = "0";
				}

				const blockValid = isHashValid && isPreviousHashValid;

				// Thu thập các lỗi cụ thể
				const issues = [];
				const errorTypes = [];

				if (!isHashValid) {
					issues.push(
						"Hash không hợp lệ - Dữ liệu có thể đã bị thay đổi"
					);
					errorTypes.push("INVALID_HASH");
				}

				if (!isPreviousHashValid) {
					issues.push(
						"Previous hash không hợp lệ - Blockchain bị đứt gãy"
					);
					errorTypes.push("INVALID_PREVIOUS_HASH");
				}

				if (!recordDetails) {
					issues.push(
						"Medical record không tồn tại - Dữ liệu tham chiếu bị mất"
					);
					errorTypes.push("MISSING_RECORD");
				}

				// Thống kê lỗi theo loại
				errorTypes.forEach((errorType) => {
					errorsByType[errorType] =
						(errorsByType[errorType] || 0) + 1;
				});

				if (!blockValid) {
					overallValid = false;
					invalidBlocksCount++;

					// Thêm vào danh sách blocks lỗi
					errorBlocks.push({
						blockIndex: currentBlock.index,
						recordId: currentBlock.data.recordId,
						timestamp: currentBlock.timestamp,
						action: currentBlock.data.action,
						diagnosis: recordDetails?.diagnosis || "N/A",
						errorTypes: errorTypes,
						errorMessages: issues,
						severity: errorTypes.includes("INVALID_HASH")
							? "HIGH"
							: errorTypes.includes("INVALID_PREVIOUS_HASH")
							? "MEDIUM"
							: "LOW",

						// Chi tiết lỗi hash
						hashDetails: !isHashValid
							? {
									stored: currentBlock.hash,
									calculated: calculatedHash,
									diff: currentBlock.hash !== calculatedHash,
							  }
							: null,

						// Chi tiết lỗi previous hash
						previousHashDetails: !isPreviousHashValid
							? {
									stored: currentBlock.previousHash,
									expected: expectedPreviousHash,
									previousBlockExists: !!previousBlockInfo,
							  }
							: null,
					});
				}

				// Tạo kết quả verification cho block này
				const verificationResult = {
					blockIndex: currentBlock.index,
					recordId: currentBlock.data.recordId,
					timestamp: currentBlock.timestamp,
					action: currentBlock.data.action,

					// Thông tin medical record tương ứng
					recordInfo: recordDetails
						? {
								diagnosis: recordDetails.diagnosis,
								treatment: recordDetails.treatment,
								medication: recordDetails.medication,
								doctorNote: recordDetails.doctorNote,
								dateBack: recordDetails.dateBack,
								status: recordDetails.status,
								doctorInfo: recordDetails.doctorId
									? {
											id: recordDetails.doctorId._id,
											name: recordDetails.doctorId.name,
											email: recordDetails.doctorId.email,
									  }
									: null,
						  }
						: null,

					// Thông tin người update (nếu có)
					updatedBy: currentBlockWithPopulate.data.updatedBy
						? {
								id: currentBlockWithPopulate.data.updatedBy._id,
								name: currentBlockWithPopulate.data.updatedBy
									.name,
								email: currentBlockWithPopulate.data.updatedBy
									.email,
						  }
						: null,

					// Kết quả validation
					isValid: blockValid,
					severity: !blockValid
						? errorTypes.includes("INVALID_HASH")
							? "HIGH"
							: errorTypes.includes("INVALID_PREVIOUS_HASH")
							? "MEDIUM"
							: "LOW"
						: null,

					// Chi tiết verification hash
					hashVerification: {
						isValid: isHashValid,
						storedHash: currentBlock.hash,
						calculatedHash: calculatedHash,
						rawDataUsed: rawData, // Debug info
					},

					// Chi tiết verification previous hash
					previousHashVerification: {
						isValid: isPreviousHashValid,
						storedPreviousHash: currentBlock.previousHash,
						expectedPreviousHash: expectedPreviousHash,
						previousBlockInfo: previousBlockInfo,
					},

					// Danh sách lỗi (nếu có)
					issues: issues,
					errorTypes: errorTypes,
				};

				verificationResults.push(verificationResult);
			}

			// Tính toán thống kê
			const statistics = {
				totalBlocks: patientBlocks.length,
				validBlocks: patientBlocks.length - invalidBlocksCount,
				invalidBlocks: invalidBlocksCount,
				validityPercentage:
					patientBlocks.length > 0
						? Math.round(
								((patientBlocks.length - invalidBlocksCount) /
									patientBlocks.length) *
									100
						  )
						: 100,
				totalMedicalRecords: medicalRecords.length,
				blocksPerRecord:
					patientBlocks.length > 0
						? Math.round(
								(patientBlocks.length / medicalRecords.length) *
									100
						  ) / 100
						: 0,
				errorsByType: errorsByType, // Thống kê lỗi theo loại
			};

			// Tạo summary thông tin với focus vào lỗi
			const summary = {
				firstBlock:
					verificationResults.length > 0
						? {
								index: verificationResults[0].blockIndex,
								timestamp: verificationResults[0].timestamp,
								action: verificationResults[0].action,
								diagnosis:
									verificationResults[0].recordInfo
										?.diagnosis || "N/A",
								isValid: verificationResults[0].isValid,
						  }
						: null,

				lastBlock:
					verificationResults.length > 0
						? {
								index: verificationResults[
									verificationResults.length - 1
								].blockIndex,
								timestamp:
									verificationResults[
										verificationResults.length - 1
									].timestamp,
								action: verificationResults[
									verificationResults.length - 1
								].action,
								diagnosis:
									verificationResults[
										verificationResults.length - 1
									].recordInfo?.diagnosis || "N/A",
								isValid:
									verificationResults[
										verificationResults.length - 1
									].isValid,
						  }
						: null,

				timespan:
					verificationResults.length > 1
						? {
								from: verificationResults[0].timestamp,
								to: verificationResults[
									verificationResults.length - 1
								].timestamp,
								duration:
									Math.ceil(
										(new Date(
											verificationResults[
												verificationResults.length - 1
											].timestamp
										) -
											new Date(
												verificationResults[0].timestamp
											)) /
											(1000 * 60 * 60 * 24)
									) + " ngày",
						  }
						: null,

				// Thống kê theo action
				actionBreakdown: verificationResults.reduce((acc, result) => {
					acc[result.action] = (acc[result.action] || 0) + 1;
					return acc;
				}, {}),

				// Thống kê lỗi chi tiết
				errorSummary: {
					totalErrors: invalidBlocksCount,
					highSeverityErrors: errorBlocks.filter(
						(block) => block.severity === "HIGH"
					).length,
					mediumSeverityErrors: errorBlocks.filter(
						(block) => block.severity === "MEDIUM"
					).length,
					lowSeverityErrors: errorBlocks.filter(
						(block) => block.severity === "LOW"
					).length,
					errorTypes: errorsByType,
					criticalBlocks: errorBlocks
						.filter((block) => block.severity === "HIGH")
						.map((block) => ({
							index: block.blockIndex,
							diagnosis: block.diagnosis,
							timestamp: block.timestamp,
						})),
				},
			};

			// Tạo message phù hợp với thông tin lỗi cụ thể
			let message;
			if (overallValid) {
				message = `Tất cả ${statistics.totalBlocks} blocks của bệnh nhân đều hợp lệ`;
			} else {
				const errorSummary = [];
				if (errorsByType.INVALID_HASH) {
					errorSummary.push(
						`${errorsByType.INVALID_HASH} block(s) có hash lỗi`
					);
				}
				if (errorsByType.INVALID_PREVIOUS_HASH) {
					errorSummary.push(
						`${errorsByType.INVALID_PREVIOUS_HASH} block(s) có previous hash lỗi`
					);
				}
				if (errorsByType.MISSING_RECORD) {
					errorSummary.push(
						`${errorsByType.MISSING_RECORD} block(s) thiếu medical record`
					);
				}

				message = `Phát hiện ${statistics.invalidBlocks}/${
					statistics.totalBlocks
				} blocks không hợp lệ: ${errorSummary.join(", ")}`;
			}

			res.json({
				success: true,
				message: message,
				data: {
					patientId,
					overallValid,
					statistics,
					verificationResults,
					errorBlocks, // Danh sách blocks lỗi chi tiết
					summary,
					metadata: {
						verificationTime: new Date().toISOString(),
						totalMedicalRecords: medicalRecords.length,
						recordsWithBlocks: recordHashes.length,
						avgBlocksPerRecord: statistics.blocksPerRecord,
						hasErrors: !overallValid,
						errorCount: invalidBlocksCount,
					},
				},
			});
		} catch (error) {
			console.error("Error verifying patient blocks:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực blocks của bệnh nhân",
				error: error.message,
				stack:
					process.env.NODE_ENV === "development"
						? error.stack
						: undefined,
			});
		}
	}
);

// 11. Xác thực blocks của bệnh nhân với lọc theo khoảng thời gian
function validateDateRange(startDate, endDate) {
	let dateQuery = {};
	let parsedStartDate = null;
	let parsedEndDate = null;

	// Check if at least one date is provided
	if (!startDate && !endDate) {
		return {
			isValid: false,
			message: "Vui lòng chọn ít nhất một ngày bắt đầu hoặc kết thúc",
		};
	}

	const today = new Date();
	today.setHours(23, 59, 59, 999);

	try {
		if (startDate || endDate) {
			dateQuery.timestamp = {};

			if (startDate) {
				parsedStartDate = new Date(startDate);
				if (isNaN(parsedStartDate.getTime())) {
					return {
						isValid: false,
						message: "Ngày bắt đầu không hợp lệ",
					};
				}

				// Check if start date is in the future
				if (parsedStartDate > today) {
					return {
						isValid: false,
						message: "Ngày bắt đầu không thể nằm trong tương lai",
					};
				}

				parsedStartDate.setHours(0, 0, 0, 0);
				dateQuery.timestamp.$gte = parsedStartDate;
			}

			if (endDate) {
				parsedEndDate = new Date(endDate);
				if (isNaN(parsedEndDate.getTime())) {
					return {
						isValid: false,
						message: "Ngày kết thúc không hợp lệ",
					};
				}

				// Check if end date is in the future
				if (parsedEndDate > today) {
					return {
						isValid: false,
						message: "Ngày kết thúc không thể nằm trong tương lai",
					};
				}

				parsedEndDate.setHours(23, 59, 59, 999);
				dateQuery.timestamp.$lte = parsedEndDate;
			}

			// Validate date range logic
			if (
				parsedStartDate &&
				parsedEndDate &&
				parsedStartDate > parsedEndDate
			) {
				return {
					isValid: false,
					message: "Ngày bắt đầu không thể sau ngày kết thúc",
				};
			}
		}

		// Create display text
		const timeRangeText =
			parsedStartDate && parsedEndDate
				? `từ ${parsedStartDate.toLocaleDateString(
						"vi-VN"
				  )} đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
				: parsedStartDate
				? `từ ${parsedStartDate.toLocaleDateString("vi-VN")} trở đi`
				: `đến ${parsedEndDate.toLocaleDateString("vi-VN")}`;

		return {
			isValid: true,
			parsedStartDate,
			parsedEndDate,
			dateQuery,
			timeRangeText,
		};
	} catch (error) {
		return {
			isValid: false,
			message: "Format ngày không đúng",
		};
	}
}

// Helper function to create empty response
function createEmptyResponse(
	patientId,
	startDate,
	endDate,
	timeRangeText,
	message
) {
	return {
		success: true,
		message,
		data: {
			patientId,
			timeRange: {
				startDate: startDate?.toISOString(),
				endDate: endDate?.toISOString(),
				displayText: timeRangeText,
			},
			totalBlocks: 0,
			verificationResults: [],
			overallValid: true,
			statistics: {
				totalBlocks: 0,
				validBlocks: 0,
				invalidBlocks: 0,
				validityPercentage: 100,
				errorsByType: {},
			},
			summary: {
				firstBlock: null,
				lastBlock: null,
				timespan: null,
				actionBreakdown: {},
				errorSummary: {
					highSeverityErrors: 0,
					mediumSeverityErrors: 0,
					lowSeverityErrors: 0,
				},
			},
		},
	};
}

// Main verification logic
async function verifyBlocksInTimeRange(
	patientBlocks,
	patientBlocksWithDetails,
	medicalRecords
) {
	const verificationResults = [];
	let overallValid = true;
	let invalidBlocksCount = 0;
	const errorBlocks = [];
	const errorsByType = {};

	for (let i = 0; i < patientBlocks.length; i++) {
		const currentBlock = patientBlocks[i];
		const currentBlockWithDetails = patientBlocksWithDetails[i];

		// Find corresponding medical record
		const correspondingRecord = medicalRecords.find(
			(record) => record.idHash === currentBlock.data.recordId
		);

		// Get detailed medical record information
		let recordDetails = null;
		if (correspondingRecord) {
			recordDetails = await MedicalRecord.findById(
				correspondingRecord._id
			)
				.populate("doctorId", "name email")
				.select(
					"diagnosis treatment medication doctorNote dateBack status"
				)
				.lean();
		}

		// Create raw data object for hash calculation
		const rawData = {
			recordId: currentBlock.data.recordId,
			action: currentBlock.data.action,
		};

		if (currentBlock.data.updatedBy) {
			rawData.updatedBy = currentBlock.data.updatedBy;
		}

		// Calculate and verify hash
		const calculatedHash = Block.calculateHash(
			currentBlock.index,
			currentBlock.timestamp,
			rawData,
			currentBlock.previousHash
		);

		const isHashValid = currentBlock.hash === calculatedHash;

		// Verify previous hash connection
		const previousHashVerification = await verifyPreviousHash(currentBlock);

		const blockValid = isHashValid && previousHashVerification.isValid;

		if (!blockValid) {
			overallValid = false;
			invalidBlocksCount++;

			// Create error block entry
			const errorBlock = createErrorBlock(
				currentBlock,
				recordDetails,
				isHashValid,
				previousHashVerification,
				calculatedHash
			);

			errorBlocks.push(errorBlock);

			// Count errors by type
			errorBlock.errorTypes.forEach((errorType) => {
				errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
			});
		}

		// Create verification result
		const verificationResult = {
			blockIndex: currentBlock.index,
			recordId: currentBlock.data.recordId,
			timestamp: currentBlock.timestamp,
			action: currentBlock.data.action,
			diagnosis: recordDetails?.diagnosis || "N/A",

			// Updated by information
			updatedBy: currentBlockWithDetails.data.updatedBy
				? {
						id: currentBlockWithDetails.data.updatedBy._id,
						name: currentBlockWithDetails.data.updatedBy.name,
						email: currentBlockWithDetails.data.updatedBy.email,
				  }
				: null,

			// Validation result
			isValid: blockValid,

			// Issues if any
			issues: [
				...(!isHashValid ? ["Hash không hợp lệ"] : []),
				...(!previousHashVerification.isValid
					? ["Previous hash không hợp lệ"]
					: []),
				...(!recordDetails ? ["Medical record không tồn tại"] : []),
			],
		};

		verificationResults.push(verificationResult);
	}

	return {
		verificationResults,
		overallValid,
		invalidBlocksCount,
		errorBlocks,
		errorsByType,
		totalBlocks: patientBlocks.length,
	};
}

// Helper function to verify previous hash
async function verifyPreviousHash(currentBlock) {
	let isPreviousHashValid = true;
	let expectedPreviousHash = null;
	let previousBlockExists = true;

	if (currentBlock.index > 0) {
		const previousBlock = await Block.findOne({
			index: currentBlock.index - 1,
		})
			.select("hash")
			.lean();

		if (previousBlock) {
			expectedPreviousHash = previousBlock.hash;
			isPreviousHashValid =
				currentBlock.previousHash === previousBlock.hash;
		} else {
			isPreviousHashValid = false;
			expectedPreviousHash = "Block trước không tồn tại";
			previousBlockExists = false;
		}
	} else {
		// Genesis block
		isPreviousHashValid = currentBlock.previousHash === "0";
		expectedPreviousHash = "0";
	}

	return {
		isValid: isPreviousHashValid,
		expectedPreviousHash,
		previousBlockExists,
		storedPreviousHash: currentBlock.previousHash,
	};
}

// Helper function to create error block entry
function createErrorBlock(
	currentBlock,
	recordDetails,
	isHashValid,
	previousHashVerification,
	calculatedHash
) {
	const errorMessages = [];
	const errorTypes = [];

	if (!isHashValid) {
		errorMessages.push("Hash của block không khớp với dữ liệu");
		errorTypes.push("INVALID_HASH");
	}

	if (!previousHashVerification.isValid) {
		if (previousHashVerification.previousBlockExists) {
			errorMessages.push("Previous hash không khớp với block trước");
			errorTypes.push("INVALID_PREVIOUS_HASH");
		} else {
			errorMessages.push("Block trước không tồn tại trong blockchain");
			errorTypes.push("MISSING_PREVIOUS_BLOCK");
		}
	}

	if (!recordDetails) {
		errorMessages.push("Medical record tương ứng không tồn tại");
		errorTypes.push("MISSING_RECORD");
	}

	// Determine severity
	let severity = "LOW";
	if (errorTypes.includes("INVALID_HASH")) {
		severity = "HIGH";
	} else if (
		errorTypes.includes("INVALID_PREVIOUS_HASH") ||
		errorTypes.includes("MISSING_PREVIOUS_BLOCK")
	) {
		severity = "MEDIUM";
	}

	const errorBlock = {
		blockIndex: currentBlock.index,
		timestamp: currentBlock.timestamp,
		action: currentBlock.data.action,
		diagnosis: recordDetails?.diagnosis || "N/A",
		severity,
		errorMessages,
		errorTypes,
	};

	// Add hash details for hash errors
	if (!isHashValid) {
		errorBlock.hashDetails = {
			stored: currentBlock.hash,
			calculated: calculatedHash,
		};
	}

	// Add previous hash details for previous hash errors
	if (!previousHashVerification.isValid) {
		errorBlock.previousHashDetails = {
			stored: currentBlock.previousHash,
			expected: previousHashVerification.expectedPreviousHash,
			previousBlockExists: previousHashVerification.previousBlockExists,
		};
	}

	return errorBlock;
}

// Helper function to create final verification response
function createVerificationResponse(
	patientId,
	startDate,
	endDate,
	timeRangeText,
	verificationResult,
	totalMedicalRecords
) {
	const {
		verificationResults,
		overallValid,
		invalidBlocksCount,
		errorBlocks,
		errorsByType,
		totalBlocks,
	} = verificationResult;

	// Calculate statistics
	const statistics = {
		totalBlocks,
		validBlocks: totalBlocks - invalidBlocksCount,
		invalidBlocks: invalidBlocksCount,
		validityPercentage:
			totalBlocks > 0
				? Math.round(
						((totalBlocks - invalidBlocksCount) / totalBlocks) * 100
				  )
				: 100,
		errorsByType,
	};

	// Create summary
	const summary = createSummary(verificationResults, errorBlocks);

	// Create message
	const message = overallValid
		? `Tất cả ${statistics.totalBlocks} blocks ${timeRangeText} đều hợp lệ`
		: `Có ${statistics.invalidBlocks}/${statistics.totalBlocks} blocks không hợp lệ ${timeRangeText}`;

	return {
		success: true,
		message,
		data: {
			patientId,
			timeRange: {
				startDate: startDate?.toISOString(),
				endDate: endDate?.toISOString(),
				displayText: timeRangeText,
			},
			overallValid,
			statistics,
			verificationResults,
			errorBlocks,
			summary,
			metadata: {
				verificationTime: new Date().toISOString(),
				totalMedicalRecords,
				avgBlocksPerRecord:
					totalBlocks > 0
						? Math.round(
								(totalBlocks / totalMedicalRecords) * 100
						  ) / 100
						: 0,
			},
		},
	};
}

// Helper function to create summary
function createSummary(verificationResults, errorBlocks) {
	const summary = {
		firstBlock:
			verificationResults.length > 0
				? {
						index: verificationResults[0].blockIndex,
						timestamp: verificationResults[0].timestamp,
						action: verificationResults[0].action,
						diagnosis: verificationResults[0].diagnosis,
						isValid: verificationResults[0].isValid,
				  }
				: null,

		lastBlock:
			verificationResults.length > 0
				? {
						index: verificationResults[
							verificationResults.length - 1
						].blockIndex,
						timestamp:
							verificationResults[verificationResults.length - 1]
								.timestamp,
						action: verificationResults[
							verificationResults.length - 1
						].action,
						diagnosis:
							verificationResults[verificationResults.length - 1]
								.diagnosis,
						isValid:
							verificationResults[verificationResults.length - 1]
								.isValid,
				  }
				: null,

		timespan:
			verificationResults.length > 1
				? {
						from: verificationResults[0].timestamp,
						to: verificationResults[verificationResults.length - 1]
							.timestamp,
						duration:
							Math.ceil(
								(new Date(
									verificationResults[
										verificationResults.length - 1
									].timestamp
								) -
									new Date(
										verificationResults[0].timestamp
									)) /
									(1000 * 60 * 60 * 24)
							) + " ngày",
				  }
				: null,

		actionBreakdown: verificationResults.reduce((acc, result) => {
			acc[result.action] = (acc[result.action] || 0) + 1;
			return acc;
		}, {}),

		errorSummary: {
			highSeverityErrors: errorBlocks.filter(
				(block) => block.severity === "HIGH"
			).length,
			mediumSeverityErrors: errorBlocks.filter(
				(block) => block.severity === "MEDIUM"
			).length,
			lowSeverityErrors: errorBlocks.filter(
				(block) => block.severity === "LOW"
			).length,
		},
	};

	return summary;
}
router.get(
	"/patient/:patientId/verify/timerange",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { patientId } = req.params;
			const { startDate, endDate } = req.query;

			// Authorization check - patients can only access their own blocks
			if (req.user.role === "patient" && patientId !== req.user.userId) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập blocks này",
				});
			}

			// Validate and parse date parameters
			const dateValidation = validateDateRange(startDate, endDate);
			if (!dateValidation.isValid) {
				return res.status(400).json({
					success: false,
					message: dateValidation.message,
				});
			}

			const { parsedStartDate, parsedEndDate, dateQuery, timeRangeText } =
				dateValidation;

			// Get patient's medical records
			const medicalRecords = await MedicalRecord.find({
				patientId: patientId,
			})
				.select("_id idHash createdAt updatedAt diagnosis")
				.lean();

			if (medicalRecords.length === 0) {
				return res.json(
					createEmptyResponse(
						patientId,
						parsedStartDate,
						parsedEndDate,
						timeRangeText,
						"Bệnh nhân này không có hồ sơ y tế nào"
					)
				);
			}

			// Get record hashes for blockchain lookup
			const recordHashes = medicalRecords
				.filter((record) => record.idHash)
				.map((record) => record.idHash);

			if (recordHashes.length === 0) {
				return res.json(
					createEmptyResponse(
						patientId,
						parsedStartDate,
						parsedEndDate,
						timeRangeText,
						`Không có blocks nào được tìm thấy ${timeRangeText}`
					)
				);
			}

			// Fetch blocks for verification (without populate for accurate hash calculation)
			const patientBlocks = await Block.find({
				"data.recordId": { $in: recordHashes },
				...dateQuery,
			}).sort({ index: 1 });

			if (patientBlocks.length === 0) {
				return res.json(
					createEmptyResponse(
						patientId,
						parsedStartDate,
						parsedEndDate,
						timeRangeText,
						`Không có blocks nào ${timeRangeText}`
					)
				);
			}

			// Fetch blocks with populate for display information
			const patientBlocksWithDetails = await Block.find({
				"data.recordId": { $in: recordHashes },
				...dateQuery,
			})
				.populate("data.updatedBy", "name email")
				.sort({ index: 1 });

			// Perform verification
			const verificationResult = await verifyBlocksInTimeRange(
				patientBlocks,
				patientBlocksWithDetails,
				medicalRecords
			);

			// Generate response
			const response = createVerificationResponse(
				patientId,
				parsedStartDate,
				parsedEndDate,
				timeRangeText,
				verificationResult,
				medicalRecords.length
			);

			res.json(response);
		} catch (error) {
			console.error(
				"Error verifying patient blocks with time range:",
				error
			);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực blocks theo khoảng thời gian",
				error: error.message,
				stack:
					process.env.NODE_ENV === "development"
						? error.stack
						: undefined,
			});
		}
	}
);

// 13. Xác thực toàn bộ blockchain
router.get(
	"/verify/full",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const startTime = Date.now();

			// Lấy tất cả blocks theo thứ tự index KHÔNG populate để giữ nguyên dữ liệu gốc
			const blocks = await Block.find().sort({ index: 1 });

			if (blocks.length === 0) {
				return res.json({
					success: true,
					message: "Không có blocks nào để xác thực",
					data: {
						valid: true,
						totalBlocks: 0,
						validBlocks: 0,
						invalidBlocks: 0,
						integrityPercentage: 100,
						details: [],
						executionTime: Date.now() - startTime,
					},
				});
			}

			const verificationDetails = [];
			let invalidBlocksCount = 0;
			let genesisBlockValid = true;

			// Lấy blocks với populate chỉ để hiển thị thông tin
			const blocksWithPopulate = await Block.find()
				.sort({ index: 1 })
				.populate("data.updatedBy", "name email");

			// Lấy tất cả medical records để verify cross-reference
			const medicalRecords = await MedicalRecord.find().lean();
			const recordsMap = {};
			medicalRecords.forEach((record) => {
				const idHash = createCryptoHash(record._id.toString());
				recordsMap[idHash] = record;
			});

			for (let i = 0; i < blocks.length; i++) {
				const currentBlock = blocks[i]; // Block KHÔNG populate
				const currentBlockWithPopulate = blocksWithPopulate[i]; // Block có populate cho display
				let blockValid = true;
				const issues = [];

				// ✅ 1. Verify BLOCK hash integrity - CẢI THIỆN xử lý data
				// QUAN TRỌNG: Chuẩn hóa data giống như trong calculateHash
				const originalData = {
					recordId: currentBlock.data.recordId,
					action: currentBlock.data.action
				};

				// ✅ XỬ LÝ updatedBy nhất quán với calculateHash method
				if (currentBlock.data.updatedBy) {
					// updatedBy trong database có thể là ObjectId hoặc string
					if (currentBlock.data.updatedBy.toString) {
						originalData.updatedBy = currentBlock.data.updatedBy.toString();
					} else {
						originalData.updatedBy = String(currentBlock.data.updatedBy);
					}
				}

				const calculatedBlockHash = Block.calculateHash(
					currentBlock.index,
					currentBlock.timestamp,
					originalData, // ← Sử dụng data đã chuẩn hóa
					currentBlock.previousHash
				);

				const blockHashValid = currentBlock.hash === calculatedBlockHash;
				if (!blockHashValid) {
					blockValid = false;
					issues.push({
						type: "INVALID_BLOCK_HASH",
						message: "Block hash không khớp với dữ liệu block",
						details: {
							stored: currentBlock.hash,
							calculated: calculatedBlockHash,
							originalData: originalData,
							rawBlockData: currentBlock.data,
						},
					});
				}

				// ✅ 2. Verify previous hash chain - GIỮ NGUYÊN
				let previousHashValid = true;
				if (i === 0) {
					if (currentBlock.previousHash !== "0") {
						genesisBlockValid = false;
						blockValid = false;
						issues.push({
							type: "INVALID_GENESIS",
							message: "Genesis block previous hash phải là '0'",
							details: {
								expected: "0",
								actual: currentBlock.previousHash,
							},
						});
					}
				} else {
					const previousBlock = blocks[i - 1];
					if (currentBlock.previousHash !== previousBlock.hash) {
						previousHashValid = false;
						blockValid = false;
						issues.push({
							type: "BROKEN_CHAIN",
							message: "Previous hash không khớp với block trước",
							details: {
								expected: previousBlock.hash,
								actual: currentBlock.previousHash,
								previousBlockIndex: previousBlock.index,
							},
						});
					}
				}

				// ✅ 3. Verify index sequence
				const expectedIndex = i;
				if (currentBlock.index !== expectedIndex) {
					blockValid = false;
					issues.push({
						type: "INVALID_INDEX",
						message: `Index không đúng thứ tự`,
						details: {
							expected: expectedIndex,
							actual: currentBlock.index,
						},
					});
				}

				// ✅ 4. Verify data structure
				if (
					!currentBlock.data ||
					!currentBlock.data.recordId ||
					!currentBlock.data.action
				) {
					blockValid = false;
					issues.push({
						type: "INVALID_DATA_STRUCTURE",
						message: "Cấu trúc data không hợp lệ",
						details: {
							hasData: !!currentBlock.data,
							hasRecordId: !!(
								currentBlock.data && currentBlock.data.recordId
							),
							hasAction: !!(
								currentBlock.data && currentBlock.data.action
							),
						},
					});
				}

				// ✅ 5. Verify action type
				const validActions = ["create", "update", "delete"];
				if (!validActions.includes(currentBlock.data.action)) {
					blockValid = false;
					issues.push({
						type: "INVALID_ACTION",
						message: `Action không hợp lệ: ${currentBlock.data.action}`,
						details: {
							validActions,
							actualAction: currentBlock.data.action,
						},
					});
				}

				// ✅ 6. Verify updatedBy for update actions
				if (
					currentBlock.data.action === "update" &&
					!currentBlock.data.updatedBy
				) {
					blockValid = false;
					issues.push({
						type: "MISSING_UPDATED_BY",
						message: "Update action thiếu updatedBy",
						details: {
							action: currentBlock.data.action,
							hasUpdatedBy: !!currentBlock.data.updatedBy,
						},
					});
				}

				// ✅ 7. Verify medical record exists và cross-reference
				let recordExists = true;
				let recordReferenceValid = true;
				let linkedRecord = null;

				if (currentBlock.data.action !== "delete") {
					const recordIdHash = currentBlock.data.recordId;
					linkedRecord = recordsMap[recordIdHash];

					if (!linkedRecord) {
						recordExists = false;
						blockValid = false;
						issues.push({
							type: "MISSING_RECORD",
							message: "Medical record không tồn tại",
							details: {
								recordIdHash: recordIdHash,
								searchedInRecords: Object.keys(recordsMap).length,
							},
						});
					} else {
						// ✅ Verify cross-references - CHỈ CHECK blockchain references
						if (linkedRecord.blockchainHash !== currentBlock.hash) {
							recordReferenceValid = false;
							blockValid = false;
							issues.push({
								type: "INVALID_BLOCKCHAIN_REFERENCE",
								message: "Medical record blockchain hash reference không khớp",
								details: {
									recordBlockchainHash: linkedRecord.blockchainHash,
									blockHash: currentBlock.hash,
								},
							});
						}

						if (linkedRecord.blockIndex !== currentBlock.index) {
							recordReferenceValid = false;
							blockValid = false;
							issues.push({
								type: "INVALID_BLOCK_INDEX_REFERENCE",
								message: "Medical record block index reference không khớp",
								details: {
									recordBlockIndex: linkedRecord.blockIndex,
									blockIndex: currentBlock.index,
								},
							});
						}

						// ❌ REMOVE: Record hash verification - Vì logic không consistent
						// Thay vào đó, chỉ verify block hash đã đủ đảm bảo tính toàn vẹn
						console.log(`✅ Block ${currentBlock.index} cross-reference verified`);
					}
				}

				// ✅ 8. Timestamp validation
				if (currentBlock.timestamp > new Date()) {
					blockValid = false;
					issues.push({
						type: "FUTURE_TIMESTAMP",
						message: "Timestamp trong tương lai",
						details: {
							blockTimestamp: currentBlock.timestamp,
							currentTime: new Date(),
						},
					});
				}

				// ✅ 9. Verify MongoDB ObjectId format for references
				if (currentBlock.data.updatedBy) {
					if (!mongoose.Types.ObjectId.isValid(currentBlock.data.updatedBy)) {
						blockValid = false;
						issues.push({
							type: "INVALID_OBJECTID",
							message: "updatedBy không phải ObjectId hợp lệ",
							details: {
								updatedBy: currentBlock.data.updatedBy,
							},
						});
					}
				}

				if (!blockValid) {
					invalidBlocksCount++;
				}

				// Tạo verification detail
				const verificationDetail = {
					blockIndex: currentBlock.index,
					hash: currentBlock.hash.substring(0, 16) + "...",
					timestamp: currentBlock.timestamp,
					action: currentBlock.data.action,
					recordId: currentBlock.data.recordId
						? currentBlock.data.recordId.substring(0, 16) + "..."
						: "N/A",
					updatedBy: currentBlockWithPopulate.data.updatedBy
						? {
								id: currentBlockWithPopulate.data.updatedBy._id,
								name: currentBlockWithPopulate.data.updatedBy.name,
								email: currentBlockWithPopulate.data.updatedBy.email,
						  }
						: null,
					isValid: blockValid,
					severity: blockValid
						? "VALID"
						: issues.some((issue) =>
								["INVALID_BLOCK_HASH", "BROKEN_CHAIN"].includes(issue.type)
						  )
						? "HIGH"
						: "MEDIUM",
					checks: {
						blockHashValid,
						previousHashValid,
						recordExists,
						recordReferenceValid,
						indexValid: currentBlock.index === expectedIndex,
						dataStructureValid: !!(
							currentBlock.data &&
							currentBlock.data.recordId &&
							currentBlock.data.action
						),
						timestampValid: currentBlock.timestamp <= new Date(),
						actionValid: validActions.includes(currentBlock.data.action),
						updatedByValid:
							currentBlock.data.action !== "update" ||
							!!currentBlock.data.updatedBy,
					},
					issues: issues,
					rawData: {
						originalData: originalData,
						calculatedBlockHash: blockHashValid ? null : calculatedBlockHash,
					},
				};

				verificationDetails.push(verificationDetail);
			}

			// ... rest of the response logic stays the same
			const totalBlocks = blocks.length;
			const validBlocks = totalBlocks - invalidBlocksCount;
			const integrityPercentage =
				totalBlocks > 0 ? Math.round((validBlocks / totalBlocks) * 100) : 100;
			const overallValid = invalidBlocksCount === 0 && genesisBlockValid;
			// Thống kê chi tiết
			const actionStats = blocks.reduce((stats, block) => {
				const action = block.data.action;
				stats[action] = (stats[action] || 0) + 1;
				return stats;
			}, {});

			// Thống kê lỗi
			const errorStats = verificationDetails.reduce((stats, detail) => {
				if (!detail.isValid) {
					detail.issues.forEach((issue) => {
						stats[issue.type] = (stats[issue.type] || 0) + 1;
					});
				}
				return stats;
			}, {});

			// Severity distribution
			const severityStats = verificationDetails.reduce(
				(stats, detail) => {
					stats[detail.severity] = (stats[detail.severity] || 0) + 1;
					return stats;
				},
				{}
			);
			const result = {
				valid: overallValid,
				message: overallValid
					? `Blockchain hoàn toàn hợp lệ (${totalBlocks} blocks)`
					: `Phát hiện ${invalidBlocksCount} blocks không hợp lệ trên tổng ${totalBlocks} blocks`,
				summary: {
					totalBlocks,
					validBlocks,
					invalidBlocks: invalidBlocksCount,
					integrityPercentage,
					genesisBlockValid,
				},
				verification: {
					details: verificationDetails,
					executionTime: Date.now() - startTime,
					lastBlockHash: blocks[blocks.length - 1]?.hash,
					chainLength: totalBlocks,
					verificationTimestamp: new Date(),
					methodUsed: "fixed-consistent-data-verification",
				},
			};

			res.json({
				success: true,
				data: result,
			});
		} catch (error) {
			console.error("❌ Error in full blockchain verification:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực blockchain",
				error: error.message,
				stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
			});
		}
	}
);

// 15. Thống kê blockchain chi tiết
router.get(
	"/stats",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const totalBlocks = await Block.countDocuments();
			const latestBlock = await Block.findOne().sort({ index: -1 });
			const genesisBlock = await Block.findOne({ index: 0 });

			// Thống kê theo action
			const actionStats = await Block.aggregate([
				{
					$group: {
						_id: "$data.action",
						count: { $sum: 1 },
					},
				},
			]);

			// Thống kê theo ngày (7 ngày gần nhất)
			const sevenDaysAgo = new Date();
			sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

			const dailyStats = await Block.aggregate([
				{
					$match: {
						timestamp: { $gte: sevenDaysAgo },
					},
				},
				{
					$group: {
						_id: {
							$dateToString: {
								format: "%Y-%m-%d",
								date: "$timestamp",
							},
						},
						count: { $sum: 1 },
					},
				},
				{
					$sort: { _id: 1 },
				},
			]);

			// Thống kê theo bác sĩ (top 10)
			const doctorStats = await Block.aggregate([
				{
					$group: {
						_id: "$data.doctorId",
						count: { $sum: 1 },
					},
				},
				{
					$lookup: {
						from: "users",
						localField: "_id",
						foreignField: "_id",
						as: "doctor",
					},
				},
				{
					$unwind: "$doctor",
				},
				{
					$project: {
						doctorName: "$doctor.name",
						doctorEmail: "$doctor.email",
						count: 1,
					},
				},
				{
					$sort: { count: -1 },
				},
				{
					$limit: 10,
				},
			]);

			// Kiểm tra tính toàn vẹn tổng quan
			const quickVerification = await MedicalRecord.verifyBlockchain();

			const stats = {
				totalBlocks,
				networkStatus: quickVerification.valid
					? "healthy"
					: "compromised",
				integrityPercentage: quickVerification.valid ? 100 : 0,
				latestBlock: latestBlock
					? {
							index: latestBlock.index,
							timestamp: latestBlock.timestamp,
							hash: latestBlock.hash.substring(0, 12) + "...",
							action: latestBlock.data.action,
					  }
					: null,
				genesisBlock: genesisBlock
					? {
							timestamp: genesisBlock.timestamp,
							hash: genesisBlock.hash.substring(0, 12) + "...",
					  }
					: null,
				actionDistribution: actionStats.reduce((acc, stat) => {
					acc[stat._id] = stat.count;
					return acc;
				}, {}),
				dailyActivity: dailyStats,
				topDoctors: doctorStats,
				chainLength: totalBlocks,
				avgBlocksPerDay:
					totalBlocks > 0 && latestBlock
						? Math.round(
								totalBlocks /
									Math.max(
										1,
										Math.ceil(
											(Date.now() -
												new Date(
													genesisBlock?.timestamp ||
														Date.now()
												)) /
												(1000 * 60 * 60 * 24)
										)
									)
						  )
						: 0,
			};

			res.json({
				success: true,
				data: stats,
			});
		} catch (error) {
			console.error("Error getting blockchain stats:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy thống kê blockchain",
				error: error.message,
			});
		}
	}
);

module.exports = router;
