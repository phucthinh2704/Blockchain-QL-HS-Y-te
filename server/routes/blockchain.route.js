const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middlewares/auth");
const Block = require("../models/Block");
const MedicalRecord = require("../models/MedicalRecord");
const createCryptoHash = require("../utils/createCryptoHash");

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
	authorize(["admin"]),
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
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 20;
			const skip = (page - 1) * limit;
			const sortBy = req.query.sortBy || "index";
			const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

			const total = await Block.countDocuments();
			const blocks = await Block.find()
				.populate("data.patientId", "name email")
				.populate("data.doctorId", "name email")
				.populate("data.updatedBy", "name email")
				.sort({ [sortBy]: sortOrder })
				.skip(skip)
				.limit(limit);

			// Add validation status for each block
			const blocksWithValidation = await Promise.all(
				blocks.map(async (block) => {
					const calculatedHash = Block.calculateHash(
						block.index,
						block.timestamp,
						block.data,
						block.previousHash
					);

					const isValid = block.hash === calculatedHash;

					return {
						...block.toObject(),
						isValid,
						calculatedHash: isValid ? null : calculatedHash, // Only show if different
					};
				})
			);

			res.json({
				success: true,
				data: blocksWithValidation,
				pagination: {
					current: page,
					pages: Math.ceil(total / limit),
					total,
					limit,
				},
			});
		} catch (error) {
			console.error("Error getting blocks:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy danh sách blocks",
				error: error.message,
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

// 8. Tính toán lại hash của một block (admin only - utility function)
router.post(
	"/block/:blockIndex/recalculate-hash",
	authenticateToken,
	authorize(["admin"]),
	async (req, res) => {
		try {
			const { blockIndex } = req.params;
			const index = parseInt(blockIndex);

			const block = await Block.findOne({ index });
			if (!block) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy block",
				});
			}

			const calculatedHash = Block.calculateHash(
				block.index,
				block.timestamp,
				block.data,
				block.previousHash
			);

			const isValid = calculatedHash === block.hash;

			res.json({
				success: true,
				data: {
					blockIndex: block.index,
					storedHash: block.hash,
					calculatedHash,
					isValid,
					timestamp: block.timestamp,
				},
			});
		} catch (error) {
			console.error("Error recalculating hash:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi tính toán hash",
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
					message: "Không có blocks nào được tìm thấy cho bệnh nhân này",
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
					issues.push("Hash không hợp lệ - Dữ liệu có thể đã bị thay đổi");
					errorTypes.push("INVALID_HASH");
				}

				if (!isPreviousHashValid) {
					issues.push("Previous hash không hợp lệ - Blockchain bị đứt gãy");
					errorTypes.push("INVALID_PREVIOUS_HASH");
				}

				if (!recordDetails) {
					issues.push("Medical record không tồn tại - Dữ liệu tham chiếu bị mất");
					errorTypes.push("MISSING_RECORD");
				}

				// Thống kê lỗi theo loại
				errorTypes.forEach(errorType => {
					errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
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
						severity: errorTypes.includes("INVALID_HASH") ? "HIGH" : 
								 errorTypes.includes("INVALID_PREVIOUS_HASH") ? "MEDIUM" : "LOW",
						
						// Chi tiết lỗi hash
						hashDetails: !isHashValid ? {
							stored: currentBlock.hash,
							calculated: calculatedHash,
							diff: currentBlock.hash !== calculatedHash
						} : null,

						// Chi tiết lỗi previous hash
						previousHashDetails: !isPreviousHashValid ? {
							stored: currentBlock.previousHash,
							expected: expectedPreviousHash,
							previousBlockExists: !!previousBlockInfo
						} : null
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
					severity: !blockValid ? (errorTypes.includes("INVALID_HASH") ? "HIGH" : 
							 errorTypes.includes("INVALID_PREVIOUS_HASH") ? "MEDIUM" : "LOW") : null,

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
								isValid: verificationResults[verificationResults.length - 1].isValid,
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
					highSeverityErrors: errorBlocks.filter(block => block.severity === "HIGH").length,
					mediumSeverityErrors: errorBlocks.filter(block => block.severity === "MEDIUM").length,
					lowSeverityErrors: errorBlocks.filter(block => block.severity === "LOW").length,
					errorTypes: errorsByType,
					criticalBlocks: errorBlocks
						.filter(block => block.severity === "HIGH")
						.map(block => ({
							index: block.blockIndex,
							diagnosis: block.diagnosis,
							timestamp: block.timestamp
						}))
				}
			};

			// Tạo message phù hợp với thông tin lỗi cụ thể
			let message;
			if (overallValid) {
				message = `Tất cả ${statistics.totalBlocks} blocks của bệnh nhân đều hợp lệ`;
			} else {
				const errorSummary = [];
				if (errorsByType.INVALID_HASH) {
					errorSummary.push(`${errorsByType.INVALID_HASH} block(s) có hash lỗi`);
				}
				if (errorsByType.INVALID_PREVIOUS_HASH) {
					errorSummary.push(`${errorsByType.INVALID_PREVIOUS_HASH} block(s) có previous hash lỗi`);
				}
				if (errorsByType.MISSING_RECORD) {
					errorSummary.push(`${errorsByType.MISSING_RECORD} block(s) thiếu medical record`);
				}
				
				message = `Phát hiện ${statistics.invalidBlocks}/${statistics.totalBlocks} blocks không hợp lệ: ${errorSummary.join(", ")}`;
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
// router.get(
// 	"/patient/:patientId/verify/timerange",
// 	authenticateToken,
// 	authorize(["patient", "doctor", "admin"]),
// 	async (req, res) => {
// 		try {
// 			const { patientId } = req.params;
// 			const { startDate, endDate } = req.query;

// 			// Patient chỉ xem blocks của chính họ
// 			if (req.user.role === "patient" && patientId !== req.user.userId) {
// 				return res.status(403).json({
// 					success: false,
// 					message: "Không có quyền truy cập blocks này",
// 				});
// 			}

// 			// Validate và parse date parameters
// 			let dateQuery = {};
// 			let parsedStartDate = null;
// 			let parsedEndDate = null;

// 			if (startDate || endDate) {
// 				dateQuery.timestamp = {};

// 				if (startDate) {
// 					try {
// 						parsedStartDate = new Date(startDate);
// 						if (isNaN(parsedStartDate.getTime())) {
// 							return res.status(400).json({
// 								success: false,
// 								message: "Ngày bắt đầu không hợp lệ",
// 							});
// 						}
// 						// Set to start of day
// 						parsedStartDate.setHours(0, 0, 0, 0);
// 						dateQuery.timestamp.$gte = parsedStartDate;
// 					} catch (error) {
// 						return res.status(400).json({
// 							success: false,
// 							message: "Format ngày bắt đầu không đúng",
// 						});
// 					}
// 				}

// 				if (endDate) {
// 					try {
// 						parsedEndDate = new Date(endDate);
// 						if (isNaN(parsedEndDate.getTime())) {
// 							return res.status(400).json({
// 								success: false,
// 								message: "Ngày kết thúc không hợp lệ",
// 							});
// 						}
// 						// Set to end of day
// 						parsedEndDate.setHours(23, 59, 59, 999);
// 						dateQuery.timestamp.$lte = parsedEndDate;
// 					} catch (error) {
// 						return res.status(400).json({
// 							success: false,
// 							message: "Format ngày kết thúc không đúng",
// 						});
// 					}
// 				}

// 				// Validate date range logic
// 				if (
// 					parsedStartDate &&
// 					parsedEndDate &&
// 					parsedStartDate > parsedEndDate
// 				) {
// 					return res.status(400).json({
// 						success: false,
// 						message: "Ngày bắt đầu không thể sau ngày kết thúc",
// 					});
// 				}
// 			}

// 			// Lấy tất cả medical records của bệnh nhân để có danh sách recordId cần tìm
// 			const medicalRecords = await MedicalRecord.find({
// 				patientId: patientId,
// 			})
// 				.select("_id idHash createdAt updatedAt")
// 				.lean();

// 			if (medicalRecords.length === 0) {
// 				const timeRangeText =
// 					parsedStartDate && parsedEndDate
// 						? `từ ${parsedStartDate.toLocaleDateString(
// 								"vi-VN"
// 						  )} đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
// 						: parsedStartDate
// 						? `từ ${parsedStartDate.toLocaleDateString(
// 								"vi-VN"
// 						  )} trở đi`
// 						: parsedEndDate
// 						? `đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
// 						: "trong khoảng thời gian này";

// 				return res.json({
// 					success: true,
// 					message: `Bệnh nhân này không có hồ sơ y tế nào`,
// 					data: {
// 						patientId,
// 						timeRange: {
// 							startDate: parsedStartDate?.toISOString(),
// 							endDate: parsedEndDate?.toISOString(),
// 							displayText: timeRangeText,
// 						},
// 						totalBlocks: 0,
// 						verificationResults: [],
// 						overallValid: true,
// 						statistics: {
// 							totalBlocks: 0,
// 							validBlocks: 0,
// 							invalidBlocks: 0,
// 							validityPercentage: 100,
// 						},
// 					},
// 				});
// 			}

// 			// Tạo danh sách recordId hashes để tìm blocks
// 			const recordHashes = medicalRecords
// 				.filter((record) => record.idHash)
// 				.map((record) => record.idHash);

// 			if (recordHashes.length === 0) {
// 				const timeRangeText =
// 					parsedStartDate && parsedEndDate
// 						? `từ ${parsedStartDate.toLocaleDateString(
// 								"vi-VN"
// 						  )} đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
// 						: parsedStartDate
// 						? `từ ${parsedStartDate.toLocaleDateString(
// 								"vi-VN"
// 						  )} trở đi`
// 						: parsedEndDate
// 						? `đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
// 						: "trong khoảng thời gian này";

// 				return res.json({
// 					success: true,
// 					message: `Không có blocks nào được tìm thấy ${timeRangeText}`,
// 					data: {
// 						patientId,
// 						timeRange: {
// 							startDate: parsedStartDate?.toISOString(),
// 							endDate: parsedEndDate?.toISOString(),
// 							displayText: timeRangeText,
// 						},
// 						totalBlocks: 0,
// 						verificationResults: [],
// 						overallValid: true,
// 						statistics: {
// 							totalBlocks: 0,
// 							validBlocks: 0,
// 							invalidBlocks: 0,
// 							validityPercentage: 100,
// 						},
// 					},
// 				});
// 			}

// 			// Lấy blocks theo điều kiện KHÔNG populate để tính hash chính xác
// 			const patientBlocks = await Block.find({
// 				"data.recordId": { $in: recordHashes },
// 				...dateQuery,
// 			}).sort({ index: 1 });

// 			// Lấy blocks với populate để hiển thị thông tin
// 			const patientBlocksWithPopulate = await Block.find({
// 				"data.recordId": { $in: recordHashes },
// 				...dateQuery,
// 			})
// 				.populate("data.updatedBy", "name email")
// 				.sort({ index: 1 });

// 			if (patientBlocks.length === 0) {
// 				const timeRangeText =
// 					parsedStartDate && parsedEndDate
// 						? `từ ${parsedStartDate.toLocaleDateString(
// 								"vi-VN"
// 						  )} đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
// 						: parsedStartDate
// 						? `từ ${parsedStartDate.toLocaleDateString(
// 								"vi-VN"
// 						  )} trở đi`
// 						: parsedEndDate
// 						? `đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
// 						: "trong khoảng thời gian này";

// 				return res.json({
// 					success: true,
// 					message: `Không có blocks nào ${timeRangeText}`,
// 					data: {
// 						patientId,
// 						timeRange: {
// 							startDate: parsedStartDate?.toISOString(),
// 							endDate: parsedEndDate?.toISOString(),
// 							displayText: timeRangeText,
// 						},
// 						totalBlocks: 0,
// 						verificationResults: [],
// 						overallValid: true,
// 						statistics: {
// 							totalBlocks: 0,
// 							validBlocks: 0,
// 							invalidBlocks: 0,
// 							validityPercentage: 100,
// 						},
// 					},
// 				});
// 			}

// 			const verificationResults = [];
// 			let overallValid = true;
// 			let invalidBlocksCount = 0;

// 			// Xác thực từng block trong khoảng thời gian
// 			for (let i = 0; i < patientBlocks.length; i++) {
// 				const currentBlock = patientBlocks[i]; // Block KHÔNG populate
// 				const currentBlockWithPopulate = patientBlocksWithPopulate[i]; // Block có populate

// 				// Tìm medical record tương ứng với block
// 				const correspondingRecord = medicalRecords.find(
// 					(record) => record.idHash === currentBlock.data.recordId
// 				);

// 				// Lấy thông tin chi tiết medical record để hiển thị
// 				let recordDetails = null;
// 				if (correspondingRecord) {
// 					recordDetails = await MedicalRecord.findById(
// 						correspondingRecord._id
// 					)
// 						.populate("doctorId", "name email")
// 						.select(
// 							"diagnosis treatment medication doctorNote dateBack status"
// 						)
// 						.lean();
// 				}

// 				// Tạo raw data object để tính hash - chỉ với các trường cần thiết theo Block schema mới
// 				const rawData = {
// 					recordId: currentBlock.data.recordId,
// 					action: currentBlock.data.action,
// 				};

// 				// Thêm updatedBy nếu có (chỉ với action update)
// 				if (currentBlock.data.updatedBy) {
// 					rawData.updatedBy = currentBlock.data.updatedBy;
// 				}

// 				// Tính lại hash của block hiện tại
// 				const calculatedHash = Block.calculateHash(
// 					currentBlock.index,
// 					currentBlock.timestamp,
// 					rawData, // Sử dụng raw data theo schema mới
// 					currentBlock.previousHash
// 				);

// 				const isHashValid = currentBlock.hash === calculatedHash;

// 				// Kiểm tra tính liên kết với blockchain chính
// 				let isPreviousHashValid = true;
// 				let expectedPreviousHash = null;
// 				let previousBlockInfo = null;

// 				if (currentBlock.index > 0) {
// 					// Lấy block trước đó trong blockchain chính (không populate)
// 					const previousBlock = await Block.findOne({
// 						index: currentBlock.index - 1,
// 					})
// 						.select("hash index timestamp data.action")
// 						.lean();

// 					if (previousBlock) {
// 						expectedPreviousHash = previousBlock.hash;
// 						isPreviousHashValid =
// 							currentBlock.previousHash === previousBlock.hash;
// 						previousBlockInfo = {
// 							index: previousBlock.index,
// 							hash: previousBlock.hash.substring(0, 12) + "...",
// 							action: previousBlock.data?.action || "unknown",
// 						};
// 					} else {
// 						isPreviousHashValid = false;
// 						expectedPreviousHash = "Block trước không tồn tại";
// 					}
// 				} else {
// 					// Genesis block - previous hash should be "0"
// 					isPreviousHashValid = currentBlock.previousHash === "0";
// 					expectedPreviousHash = "0";
// 				}

// 				const blockValid = isHashValid && isPreviousHashValid;

// 				if (!blockValid) {
// 					overallValid = false;
// 					invalidBlocksCount++;
// 				}

// 				// Tạo kết quả verification cho block này
// 				const verificationResult = {
// 					blockIndex: currentBlock.index,
// 					recordId: currentBlock.data.recordId,
// 					timestamp: currentBlock.timestamp,
// 					action: currentBlock.data.action,

// 					// Thông tin medical record tương ứng
// 					recordInfo: recordDetails
// 						? {
// 								diagnosis: recordDetails.diagnosis,
// 								treatment: recordDetails.treatment,
// 								medication: recordDetails.medication,
// 								doctorNote: recordDetails.doctorNote,
// 								dateBack: recordDetails.dateBack,
// 								status: recordDetails.status,
// 								doctorInfo: recordDetails.doctorId
// 									? {
// 											id: recordDetails.doctorId._id,
// 											name: recordDetails.doctorId.name,
// 											email: recordDetails.doctorId.email,
// 									  }
// 									: null,
// 						  }
// 						: null,

// 					// Thông tin người update (nếu có)
// 					updatedBy: currentBlockWithPopulate.data.updatedBy
// 						? {
// 								id: currentBlockWithPopulate.data.updatedBy._id,
// 								name: currentBlockWithPopulate.data.updatedBy
// 									.name,
// 								email: currentBlockWithPopulate.data.updatedBy
// 									.email,
// 						  }
// 						: null,

// 					// Kết quả validation
// 					isValid: blockValid,

// 					// Chi tiết verification hash
// 					hashVerification: {
// 						isValid: isHashValid,
// 						storedHash: currentBlock.hash,
// 						calculatedHash: calculatedHash,
// 						rawDataUsed: rawData, // Debug info
// 					},

// 					// Chi tiết verification previous hash
// 					previousHashVerification: {
// 						isValid: isPreviousHashValid,
// 						storedPreviousHash: currentBlock.previousHash,
// 						expectedPreviousHash: expectedPreviousHash,
// 						previousBlockInfo: previousBlockInfo,
// 					},

// 					// Danh sách lỗi (nếu có)
// 					issues: [
// 						...(!isHashValid ? ["Hash không hợp lệ"] : []),
// 						...(!isPreviousHashValid
// 							? ["Previous hash không hợp lệ"]
// 							: []),
// 						...(!recordDetails
// 							? ["Medical record không tồn tại"]
// 							: []),
// 					],
// 				};

// 				verificationResults.push(verificationResult);
// 			}

// 			// Tính toán thống kê
// 			const statistics = {
// 				totalBlocks: patientBlocks.length,
// 				validBlocks: patientBlocks.length - invalidBlocksCount,
// 				invalidBlocks: invalidBlocksCount,
// 				validityPercentage:
// 					patientBlocks.length > 0
// 						? Math.round(
// 								((patientBlocks.length - invalidBlocksCount) /
// 									patientBlocks.length) *
// 									100
// 						  )
// 						: 100,
// 				totalMedicalRecords: medicalRecords.length,
// 				blocksPerRecord:
// 					patientBlocks.length > 0
// 						? Math.round(
// 								(patientBlocks.length / medicalRecords.length) *
// 									100
// 						  ) / 100
// 						: 0,
// 			};

// 			// Tạo message mô tả khoảng thời gian
// 			const timeRangeText =
// 				parsedStartDate && parsedEndDate
// 					? `từ ${parsedStartDate.toLocaleDateString(
// 							"vi-VN"
// 					  )} đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
// 					: parsedStartDate
// 					? `từ ${parsedStartDate.toLocaleDateString("vi-VN")} trở đi`
// 					: parsedEndDate
// 					? `đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
// 					: "trong khoảng thời gian này";

// 			const message = overallValid
// 				? `Tất cả ${statistics.totalBlocks} blocks ${timeRangeText} đều hợp lệ`
// 				: `Có ${statistics.invalidBlocks}/${statistics.totalBlocks} blocks không hợp lệ ${timeRangeText}`;

// 			// Tạo summary thông tin với action breakdown
// 			const summary = {
// 				firstBlock:
// 					verificationResults.length > 0
// 						? {
// 								index: verificationResults[0].blockIndex,
// 								timestamp: verificationResults[0].timestamp,
// 								action: verificationResults[0].action,
// 								diagnosis:
// 									verificationResults[0].recordInfo
// 										?.diagnosis || "N/A",
// 						  }
// 						: null,

// 				lastBlock:
// 					verificationResults.length > 0
// 						? {
// 								index: verificationResults[
// 									verificationResults.length - 1
// 								].blockIndex,
// 								timestamp:
// 									verificationResults[
// 										verificationResults.length - 1
// 									].timestamp,
// 								action: verificationResults[
// 									verificationResults.length - 1
// 								].action,
// 								diagnosis:
// 									verificationResults[
// 										verificationResults.length - 1
// 									].recordInfo?.diagnosis || "N/A",
// 						  }
// 						: null,

// 				timespan:
// 					verificationResults.length > 1
// 						? {
// 								from: verificationResults[0].timestamp,
// 								to: verificationResults[
// 									verificationResults.length - 1
// 								].timestamp,
// 								duration:
// 									Math.ceil(
// 										(new Date(
// 											verificationResults[
// 												verificationResults.length - 1
// 											].timestamp
// 										) -
// 											new Date(
// 												verificationResults[0].timestamp
// 											)) /
// 											(1000 * 60 * 60 * 24)
// 									) + " ngày",
// 						  }
// 						: null,

// 				// Thống kê theo action trong khoảng thời gian
// 				actionBreakdown: verificationResults.reduce((acc, result) => {
// 					acc[result.action] = (acc[result.action] || 0) + 1;
// 					return acc;
// 				}, {}),
// 			};

// 			res.json({
// 				success: true,
// 				message: message,
// 				data: {
// 					patientId,
// 					timeRange: {
// 						startDate: parsedStartDate?.toISOString(),
// 						endDate: parsedEndDate?.toISOString(),
// 						displayText: timeRangeText,
// 					},
// 					overallValid,
// 					statistics,
// 					verificationResults,
// 					summary,
// 					metadata: {
// 						verificationTime: new Date().toISOString(),
// 						totalMedicalRecords: medicalRecords.length,
// 						recordsWithBlocks: recordHashes.length,
// 						avgBlocksPerRecord: statistics.blocksPerRecord,
// 						timeRangeQuery: dateQuery,
// 					},
// 				},
// 			});
// 		} catch (error) {
// 			console.error(
// 				"Error verifying patient blocks with time range:",
// 				error
// 			);
// 			res.status(500).json({
// 				success: false,
// 				message: "Lỗi xác thực blocks theo khoảng thời gian",
// 				error: error.message,
// 				stack:
// 					process.env.NODE_ENV === "development"
// 						? error.stack
// 						: undefined,
// 			});
// 		}
// 	}
// );
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
			if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
				return {
					isValid: false,
					message: "Ngày bắt đầu không thể sau ngày kết thúc",
				};
			}
		}

		// Create display text
		const timeRangeText = parsedStartDate && parsedEndDate
			? `từ ${parsedStartDate.toLocaleDateString("vi-VN")} đến ${parsedEndDate.toLocaleDateString("vi-VN")}`
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
function createEmptyResponse(patientId, startDate, endDate, timeRangeText, message) {
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
async function verifyBlocksInTimeRange(patientBlocks, patientBlocksWithDetails, medicalRecords) {
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
			recordDetails = await MedicalRecord.findById(correspondingRecord._id)
				.populate("doctorId", "name email")
				.select("diagnosis treatment medication doctorNote dateBack status")
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
			errorBlock.errorTypes.forEach(errorType => {
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
			updatedBy: currentBlockWithDetails.data.updatedBy ? {
				id: currentBlockWithDetails.data.updatedBy._id,
				name: currentBlockWithDetails.data.updatedBy.name,
				email: currentBlockWithDetails.data.updatedBy.email,
			} : null,

			// Validation result
			isValid: blockValid,

			// Issues if any
			issues: [
				...(!isHashValid ? ["Hash không hợp lệ"] : []),
				...(!previousHashVerification.isValid ? ["Previous hash không hợp lệ"] : []),
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
			isPreviousHashValid = currentBlock.previousHash === previousBlock.hash;
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
function createErrorBlock(currentBlock, recordDetails, isHashValid, previousHashVerification, calculatedHash) {
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
	} else if (errorTypes.includes("INVALID_PREVIOUS_HASH") || errorTypes.includes("MISSING_PREVIOUS_BLOCK")) {
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
function createVerificationResponse(patientId, startDate, endDate, timeRangeText, verificationResult, totalMedicalRecords) {
	const { verificationResults, overallValid, invalidBlocksCount, errorBlocks, errorsByType, totalBlocks } = verificationResult;

	// Calculate statistics
	const statistics = {
		totalBlocks,
		validBlocks: totalBlocks - invalidBlocksCount,
		invalidBlocks: invalidBlocksCount,
		validityPercentage: totalBlocks > 0 ? Math.round(((totalBlocks - invalidBlocksCount) / totalBlocks) * 100) : 100,
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
				avgBlocksPerRecord: totalBlocks > 0 ? Math.round((totalBlocks / totalMedicalRecords) * 100) / 100 : 0,
			},
		},
	};
}

// Helper function to create summary
function createSummary(verificationResults, errorBlocks) {
	const summary = {
		firstBlock: verificationResults.length > 0 ? {
			index: verificationResults[0].blockIndex,
			timestamp: verificationResults[0].timestamp,
			action: verificationResults[0].action,
			diagnosis: verificationResults[0].diagnosis,
			isValid: verificationResults[0].isValid,
		} : null,

		lastBlock: verificationResults.length > 0 ? {
			index: verificationResults[verificationResults.length - 1].blockIndex,
			timestamp: verificationResults[verificationResults.length - 1].timestamp,
			action: verificationResults[verificationResults.length - 1].action,
			diagnosis: verificationResults[verificationResults.length - 1].diagnosis,
			isValid: verificationResults[verificationResults.length - 1].isValid,
		} : null,

		timespan: verificationResults.length > 1 ? {
			from: verificationResults[0].timestamp,
			to: verificationResults[verificationResults.length - 1].timestamp,
			duration: Math.ceil(
				(new Date(verificationResults[verificationResults.length - 1].timestamp) -
					new Date(verificationResults[0].timestamp)) /
				(1000 * 60 * 60 * 24)
			) + " ngày",
		} : null,

		actionBreakdown: verificationResults.reduce((acc, result) => {
			acc[result.action] = (acc[result.action] || 0) + 1;
			return acc;
		}, {}),

		errorSummary: {
			highSeverityErrors: errorBlocks.filter(block => block.severity === "HIGH").length,
			mediumSeverityErrors: errorBlocks.filter(block => block.severity === "MEDIUM").length,
			lowSeverityErrors: errorBlocks.filter(block => block.severity === "LOW").length,
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

			const { parsedStartDate, parsedEndDate, dateQuery, timeRangeText } = dateValidation;

			// Get patient's medical records
			const medicalRecords = await MedicalRecord.find({
				patientId: patientId,
			})
				.select("_id idHash createdAt updatedAt diagnosis")
				.lean();

			if (medicalRecords.length === 0) {
				return res.json(createEmptyResponse(patientId, parsedStartDate, parsedEndDate, timeRangeText, "Bệnh nhân này không có hồ sơ y tế nào"));
			}

			// Get record hashes for blockchain lookup
			const recordHashes = medicalRecords
				.filter((record) => record.idHash)
				.map((record) => record.idHash);

			if (recordHashes.length === 0) {
				return res.json(createEmptyResponse(patientId, parsedStartDate, parsedEndDate, timeRangeText, `Không có blocks nào được tìm thấy ${timeRangeText}`));
			}

			// Fetch blocks for verification (without populate for accurate hash calculation)
			const patientBlocks = await Block.find({
				"data.recordId": { $in: recordHashes },
				...dateQuery,
			}).sort({ index: 1 });

			if (patientBlocks.length === 0) {
				return res.json(createEmptyResponse(patientId, parsedStartDate, parsedEndDate, timeRangeText, `Không có blocks nào ${timeRangeText}`));
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
			console.error("Error verifying patient blocks with time range:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực blocks theo khoảng thời gian",
				error: error.message,
				stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
			});
		}
	}
);

// 13. Xác thực toàn bộ blockchain (Enhanced version)
router.get(
	"/verify/full",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const startTime = Date.now();

			// Lấy tất cả blocks theo thứ tự index
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

			for (let i = 0; i < blocks.length; i++) {
				const currentBlock = blocks[i];
				let blockValid = true;
				const issues = [];

				// 1. Verify hash integrity
				const calculatedHash = Block.calculateHash(
					currentBlock.index,
					currentBlock.timestamp,
					currentBlock.data,
					currentBlock.previousHash
				);

				const hashValid = currentBlock.hash === calculatedHash;
				if (!hashValid) {
					blockValid = false;
					issues.push("Hash không hợp lệ");
				}

				// 2. Verify previous hash chain (skip genesis block)
				let previousHashValid = true;
				if (i === 0) {
					// Genesis block - previous hash should be "0"
					if (currentBlock.previousHash !== "0") {
						genesisBlockValid = false;
						blockValid = false;
						issues.push("Genesis block previous hash không hợp lệ");
					}
				} else {
					const previousBlock = blocks[i - 1];
					if (currentBlock.previousHash !== previousBlock.hash) {
						previousHashValid = false;
						blockValid = false;
						issues.push("Previous hash không khớp");
					}
				}

				// 3. Verify index sequence
				const expectedIndex = i;
				if (currentBlock.index !== expectedIndex) {
					blockValid = false;
					issues.push(
						`Index không đúng thứ tự (expected: ${expectedIndex}, actual: ${currentBlock.index})`
					);
				}

				// 4. Verify medical record exists (if not deleted)
				let recordExists = true;
				if (currentBlock.data.action !== "delete") {
					const record = await MedicalRecord.findById(
						currentBlock.data.recordId
					);
					if (!record) {
						recordExists = false;
						blockValid = false;
						issues.push("Medical record không tồn tại");
					}
				}

				if (!blockValid) {
					invalidBlocksCount++;
				}

				verificationDetails.push({
					blockIndex: currentBlock.index,
					hash: currentBlock.hash.substring(0, 16) + "...",
					timestamp: currentBlock.timestamp,
					action: currentBlock.data.action,
					diagnosis: currentBlock.data.diagnosis,
					isValid: blockValid,
					hashValid,
					previousHashValid,
					recordExists,
					issues: issues.length > 0 ? issues : ["Hợp lệ"],
				});
			}

			const totalBlocks = blocks.length;
			const validBlocks = totalBlocks - invalidBlocksCount;
			const integrityPercentage =
				totalBlocks > 0
					? Math.round((validBlocks / totalBlocks) * 100)
					: 100;
			const overallValid = invalidBlocksCount === 0 && genesisBlockValid;

			const result = {
				valid: overallValid,
				message: overallValid
					? `Blockchain hoàn toàn hợp lệ (${totalBlocks} blocks)`
					: `Phát hiện ${invalidBlocksCount} blocks không hợp lệ`,
				totalBlocks,
				validBlocks,
				invalidBlocks: invalidBlocksCount,
				integrityPercentage,
				genesisBlockValid,
				details: verificationDetails,
				executionTime: Date.now() - startTime,
				lastBlockHash: blocks[blocks.length - 1]?.hash,
				chainLength: totalBlocks,
			};

			res.json({
				success: true,
				data: result,
			});
		} catch (error) {
			console.error("Error in full blockchain verification:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực blockchain",
				error: error.message,
			});
		}
	}
);

// 14. Xác thực blockchain với phân trang (cho admin interface)
router.get(
	"/verify/paginated",
	authenticateToken,
	authorize(["admin"]),
	async (req, res) => {
		try {
			const page = parseInt(req.query.page) || 1;
			const limit = parseInt(req.query.limit) || 50;
			const skip = (page - 1) * limit;

			const totalBlocks = await Block.countDocuments();
			const blocks = await Block.find()
				.sort({ index: 1 })
				.skip(skip)
				.limit(limit);

			const verificationResults = [];

			for (const block of blocks) {
				const calculatedHash = Block.calculateHash(
					block.index,
					block.timestamp,
					block.data,
					block.previousHash
				);

				const hashValid = block.hash === calculatedHash;

				// Verify previous hash
				let previousHashValid = true;
				if (block.index > 0) {
					const previousBlock = await Block.findOne({
						index: block.index - 1,
					});
					if (
						!previousBlock ||
						block.previousHash !== previousBlock.hash
					) {
						previousHashValid = false;
					}
				}

				verificationResults.push({
					blockIndex: block.index,
					timestamp: block.timestamp,
					hash: block.hash,
					hashValid,
					previousHashValid,
					isValid: hashValid && previousHashValid,
					action: block.data.action,
					recordId: block.data.recordId,
				});
			}

			res.json({
				success: true,
				data: {
					blocks: verificationResults,
					pagination: {
						current: page,
						pages: Math.ceil(totalBlocks / limit),
						total: totalBlocks,
						limit,
					},
				},
			});
		} catch (error) {
			console.error("Error in paginated verification:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xác thực blockchain",
				error: error.message,
			});
		}
	}
);

// 15. Thống kê blockchain chi tiết
router.get(
	"/stats",
	authenticateToken,
	authorize(["admin"]),
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

// 16. Sửa chữa blockchain (admin only - cực kỳ nguy hiểm)
router.post(
	"/repair",
	authenticateToken,
	authorize(["admin"]),
	async (req, res) => {
		try {
			const { confirmPassword, repairType } = req.body;

			// Thêm validation password admin ở đây
			if (!confirmPassword) {
				return res.status(400).json({
					success: false,
					message:
						"Cần xác nhận mật khẩu để thực hiện sửa chữa blockchain",
				});
			}

			const repairResults = [];

			if (repairType === "recalculate_hashes") {
				// Tính lại hash cho tất cả blocks
				const blocks = await Block.find().sort({ index: 1 });

				for (let i = 0; i < blocks.length; i++) {
					const block = blocks[i];
					const correctHash = Block.calculateHash(
						block.index,
						block.timestamp,
						block.data,
						block.previousHash
					);

					if (block.hash !== correctHash) {
						await Block.findByIdAndUpdate(block._id, {
							hash: correctHash,
						});
						repairResults.push({
							blockIndex: block.index,
							oldHash: block.hash,
							newHash: correctHash,
							status: "repaired",
						});
					}
				}
			} else if (repairType === "rebuild_chain") {
				// Xây dựng lại toàn bộ chain
				const blocks = await Block.find().sort({ index: 1 });

				for (let i = 0; i < blocks.length; i++) {
					const block = blocks[i];
					const previousHash = i === 0 ? "0" : blocks[i - 1].hash;

					const correctHash = Block.calculateHash(
						block.index,
						block.timestamp,
						block.data,
						previousHash
					);

					await Block.findByIdAndUpdate(block._id, {
						previousHash,
						hash: correctHash,
					});

					repairResults.push({
						blockIndex: block.index,
						previousHash,
						hash: correctHash,
						status: "rebuilt",
					});
				}
			}

			res.json({
				success: true,
				message: `Blockchain đã được sửa chữa thành công (${repairType})`,
				data: {
					repairsCount: repairResults.length,
					repairs: repairResults,
				},
			});
		} catch (error) {
			console.error("Error repairing blockchain:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi sửa chữa blockchain",
				error: error.message,
			});
		}
	}
);

// 17. Export blockchain data
router.get(
	"/export",
	authenticateToken,
	authorize(["admin"]),
	async (req, res) => {
		try {
			const format = req.query.format || "json";
			const includeData = req.query.includeData !== "false";

			const blocks = await Block.find()
				.populate("data.patientId", "name email")
				.populate("data.doctorId", "name email")
				.sort({ index: 1 });

			let exportData;

			if (includeData) {
				exportData = blocks.map((block) => ({
					index: block.index,
					timestamp: block.timestamp,
					hash: block.hash,
					previousHash: block.previousHash,
					data: {
						...block.data,
						patientInfo: block.data.patientId
							? {
									name: block.data.patientId.name,
									email: block.data.patientId.email,
							  }
							: null,
						doctorInfo: block.data.doctorId
							? {
									name: block.data.doctorId.name,
									email: block.data.doctorId.email,
							  }
							: null,
					},
				}));
			} else {
				exportData = blocks.map((block) => ({
					index: block.index,
					timestamp: block.timestamp,
					hash: block.hash,
					previousHash: block.previousHash,
					action: block.data.action,
				}));
			}

			if (format === "csv") {
				// Convert to CSV format
				const csvData = exportData.map((block) => ({
					Index: block.index,
					Timestamp: block.timestamp,
					Hash: block.hash,
					PreviousHash: block.previousHash,
					Action: block.data?.action || block.action,
				}));

				res.setHeader("Content-Type", "text/csv");
				res.setHeader(
					"Content-Disposition",
					"attachment; filename=blockchain_export.csv"
				);

				// Simple CSV conversion
				const csvString = [
					Object.keys(csvData[0]).join(","),
					...csvData.map((row) => Object.values(row).join(",")),
				].join("\n");

				return res.send(csvString);
			}

			res.json({
				success: true,
				data: {
					exportedAt: new Date(),
					totalBlocks: exportData.length,
					format,
					includeData,
					blocks: exportData,
				},
			});
		} catch (error) {
			console.error("Error exporting blockchain:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi export blockchain",
				error: error.message,
			});
		}
	}
);

// 18. Tìm kiếm blocks theo tiêu chí
router.get(
	"/search",
	authenticateToken,
	authorize(["admin", "doctor"]),
	async (req, res) => {
		try {
			const {
				action,
				patientId,
				doctorId,
				diagnosis,
				fromDate,
				toDate,
				hashPattern,
				page = 1,
				limit = 20,
			} = req.query;

			const skip = (parseInt(page) - 1) * parseInt(limit);
			const query = {};

			// Build search query
			if (action) query["data.action"] = action;
			if (patientId) query["data.patientId"] = patientId;
			if (doctorId) query["data.doctorId"] = doctorId;
			if (diagnosis)
				query["data.diagnosis"] = { $regex: diagnosis, $options: "i" };
			if (hashPattern)
				query.hash = { $regex: hashPattern, $options: "i" };

			if (fromDate || toDate) {
				query.timestamp = {};
				if (fromDate) query.timestamp.$gte = new Date(fromDate);
				if (toDate) query.timestamp.$lte = new Date(toDate);
			}

			const total = await Block.countDocuments(query);
			const blocks = await Block.find(query)
				.populate("data.patientId", "name email")
				.populate("data.doctorId", "name email")
				.populate("data.updatedBy", "name email")
				.sort({ index: -1 })
				.skip(skip)
				.limit(parseInt(limit));

			res.json({
				success: true,
				data: {
					blocks,
					pagination: {
						current: parseInt(page),
						pages: Math.ceil(total / parseInt(limit)),
						total,
						limit: parseInt(limit),
					},
				},
			});
		} catch (error) {
			console.error("Error searching blocks:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi tìm kiếm blocks",
				error: error.message,
			});
		}
	}
);

module.exports = router;
