const express = require("express");
const router = express.Router();
const MedicalRecord = require("../models/MedicalRecord");
const Block = require("../models/Block");
const { authenticateToken, authorize } = require("../middlewares/auth");

// 1. Tạo hồ sơ y tế mới (chỉ doctor)
router.post("/", authenticateToken, authorize(["doctor"]), async (req, res) => {
	try {
		const {
			patientId,
			diagnosis,
			treatment,
			medication,
			doctorNote,
			dateBack,
		} = req.body;
		const doctorId = req.user.userId;

		// Validate input
		if (!patientId || !diagnosis) {
			return res.status(400).json({
				success: false,
				message: "Thiếu thông tin bắt buộc (patientId, diagnosis)",
			});
		}

		// Validate dateBack if provided
		let parsedDateBack = null;
		if (dateBack) {
			parsedDateBack = new Date(dateBack);
			if (isNaN(parsedDateBack.getTime())) {
				return res.status(400).json({
					success: false,
					message: "Định dạng ngày hẹn tái khám không hợp lệ",
				});
			}
		}

		// Tạo medical record (blockchain sẽ được tự động tạo trong middleware)
		const medicalRecord = new MedicalRecord({
			patientId,
			doctorId,
			diagnosis,
			treatment: treatment || "",
			medication: medication || "",
			doctorNote: doctorNote || "",
			dateBack: parsedDateBack,
		});

		await medicalRecord.save();

		// Populate thông tin sau khi lưu
		await medicalRecord.populate("patientId", "name email");
		await medicalRecord.populate("doctorId", "name email");

		res.status(201).json({
			success: true,
			message: "Tạo hồ sơ y tế thành công",
			data: medicalRecord,
		});
	} catch (error) {
		console.error("Error creating medical record:", error);
		res.status(500).json({
			success: false,
			message: "Lỗi tạo hồ sơ y tế",
			error: error.message,
		});
	}
});

// 2. Lấy hồ sơ theo ID (tất cả role nhưng có kiểm tra quyền)
router.get(
	"/:id",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;

			const record = await MedicalRecord.findById(id)
				.populate("patientId", "name email phoneNumber")
				.populate("doctorId", "name email");

			if (!record) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Kiểm tra quyền truy cập: patient chỉ xem được hồ sơ của mình
			if (
				req.user.role === "patient" &&
				record.patientId._id.toString() !== req.user.userId
			) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập hồ sơ này",
				});
			}

			res.json({
				success: true,
				data: record,
			});
		} catch (error) {
			console.error("Error getting medical record:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy thông tin hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 3. Cập nhật hồ sơ y tế (chỉ doctor)
router.put(
	"/:id",
	authenticateToken,
	authorize(["doctor"]),
	async (req, res) => {
		try {
			const { id } = req.params;
			const { diagnosis, treatment, medication, doctorNote, dateBack } =
				req.body;

			// Validate dateBack if provided
			let parsedDateBack = undefined;
			if (dateBack !== undefined) {
				if (dateBack === null || dateBack === "") {
					parsedDateBack = null;
				} else {
					parsedDateBack = new Date(dateBack);
					if (isNaN(parsedDateBack.getTime())) {
						return res.status(400).json({
							success: false,
							message: "Định dạng ngày hẹn tái khám không hợp lệ",
						});
					}
				}
			}

			// Prepare update object - only include fields that are provided
			const updateData = {};
			if (diagnosis !== undefined) updateData.diagnosis = diagnosis;
			if (treatment !== undefined) updateData.treatment = treatment;
			if (medication !== undefined) updateData.medication = medication;
			if (doctorNote !== undefined) updateData.doctorNote = doctorNote;
			if (dateBack !== undefined) updateData.dateBack = parsedDateBack;

			const record = await MedicalRecord.findByIdAndUpdate(
				id,
				updateData,
				{ new: true }
			)
				.populate("patientId", "name email")
				.populate("doctorId", "name email");

			if (!record) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Tạo block cho việc update
			try {
				const latestBlock = await Block.findOne().sort({ index: -1 });
				const previousHash = latestBlock ? latestBlock.hash : "0";
				const newIndex = latestBlock ? latestBlock.index + 1 : 0;

				const updateBlock = new Block({
					index: newIndex,
					timestamp: new Date(),
					data: {
						recordId: record._id,
						patientId: record.patientId._id || record.patientId,
						doctorId: record.doctorId._id || record.doctorId,
						diagnosis: record.diagnosis,
						treatment: record.treatment,
						medication: record.medication,
						doctorNote: record.doctorNote,
						dateBack: record.dateBack,
						action: "update",
						updatedBy: req.user.userId, // Người thực hiện cập nhật
					},
					previousHash: previousHash,
				});

				updateBlock.hash = Block.calculateHash(
					updateBlock.index,
					updateBlock.timestamp,
					updateBlock.data,
					updateBlock.previousHash
				);

				await updateBlock.save();

				await record.updateOne({
					blockchainHash: updateBlock.hash,
					blockIndex: updateBlock.index,
				});

				console.log(
					`✅ Update block ${newIndex} created for medical record ${record._id}`
				);
			} catch (blockError) {
				console.error("Error creating update block:", blockError);
				// Continue with response even if blockchain fails
			}

			return res.status(200).json({
				success: true,
				message: "Cập nhật hồ sơ y tế thành công",
				data: record,
			});
		} catch (error) {
			console.error("Error updating medical record:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi cập nhật hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 4. Lấy tất cả hồ sơ của một bệnh nhân
router.get(
	"/patient/:patientId",
	authenticateToken,
	authorize(["patient", "doctor", "admin"]),
	async (req, res) => {
		try {
			const { patientId } = req.params;

			// Patient chỉ xem được hồ sơ của chính họ
			if (req.user.role === "patient" && patientId !== req.user.userId) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập hồ sơ này",
				});
			}

			const records = await MedicalRecord.find({ patientId })
				.populate("doctorId", "name email")
				.sort({ createdAt: -1 });

			res.json({
				success: true,
				data: records,
				total: records.length,
			});
		} catch (error) {
			console.error("Error getting patient records:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy hồ sơ bệnh nhân",
				error: error.message,
			});
		}
	}
);

// 5. Lấy tất cả hồ sơ do một bác sĩ tạo (chỉ doctor và admin)
router.get(
	"/doctor/:doctorId",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const { doctorId } = req.params;

			// Doctor chỉ xem được hồ sơ do chính họ tạo (trừ admin)
			if (req.user.role === "doctor" && doctorId !== req.user.userId) {
				return res.status(403).json({
					success: false,
					message: "Không có quyền truy cập hồ sơ này",
				});
			}

			const records = await MedicalRecord.find({ doctorId })
				.populate("patientId", "name email phoneNumber dateOfBirth")
				.sort({ createdAt: -1 });

			res.json({
				success: true,
				data: records,
				total: records.length,
			});
		} catch (error) {
			console.error("Error getting doctor records:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy hồ sơ bác sĩ",
				error: error.message,
			});
		}
	}
);

// 6. Lấy danh sách hẹn tái khám (chỉ doctor và admin)
router.get(
	"/appointments/upcoming",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			// Filter by doctor if user is doctor
			const filter = {
				dateBack: { $gte: today },
			};

			if (req.user.role === "doctor") {
				filter.doctorId = req.user.userId;
			}

			const appointments = await MedicalRecord.find(filter)
				.populate("patientId", "name email phoneNumber")
				.populate("doctorId", "name email")
				.sort({ dateBack: 1 });

			res.json({
				success: true,
				data: appointments,
				total: appointments.length,
			});
		} catch (error) {
			console.error("Error getting upcoming appointments:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy danh sách hẹn tái khám",
				error: error.message,
			});
		}
	}
);

// 7. Tìm kiếm hồ sơ y tế (chỉ doctor và admin)
router.get(
	"/search",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const {
				diagnosis,
				medication,
				patientName,
				doctorName,
				fromDate,
				toDate,
				page = 1,
				limit = 10,
			} = req.query;

			const skip = (parseInt(page) - 1) * parseInt(limit);
			let pipeline = [];

			// Match stage
			const matchConditions = {};

			// Filter by doctor if user is doctor role
			if (req.user.role === "doctor") {
				matchConditions.doctorId = new mongoose.Types.ObjectId(
					req.user.userId
				);
			}

			// Date range filter
			if (fromDate || toDate) {
				matchConditions.createdAt = {};
				if (fromDate)
					matchConditions.createdAt.$gte = new Date(fromDate);
				if (toDate) {
					const endDate = new Date(toDate);
					endDate.setHours(23, 59, 59, 999);
					matchConditions.createdAt.$lte = endDate;
				}
			}

			// Text search filters
			if (diagnosis) {
				matchConditions.diagnosis = {
					$regex: diagnosis,
					$options: "i",
				};
			}
			if (medication) {
				matchConditions.medication = {
					$regex: medication,
					$options: "i",
				};
			}

			pipeline.push({ $match: matchConditions });

			// Populate patient and doctor info
			pipeline.push(
				{
					$lookup: {
						from: "users",
						localField: "patientId",
						foreignField: "_id",
						as: "patientInfo",
					},
				},
				{
					$lookup: {
						from: "users",
						localField: "doctorId",
						foreignField: "_id",
						as: "doctorInfo",
					},
				}
			);

			// Filter by patient or doctor name if provided
			if (patientName || doctorName) {
				const nameFilters = [];
				if (patientName) {
					nameFilters.push({
						"patientInfo.name": {
							$regex: patientName,
							$options: "i",
						},
					});
				}
				if (doctorName) {
					nameFilters.push({
						"doctorInfo.name": {
							$regex: doctorName,
							$options: "i",
						},
					});
				}
				pipeline.push({ $match: { $and: nameFilters } });
			}

			// Get total count
			const totalPipeline = [...pipeline, { $count: "total" }];
			const totalResult = await MedicalRecord.aggregate(totalPipeline);
			const total = totalResult[0]?.total || 0;

			// Add pagination and sorting
			pipeline.push(
				{ $sort: { createdAt: -1 } },
				{ $skip: skip },
				{ $limit: parseInt(limit) }
			);

			const records = await MedicalRecord.aggregate(pipeline);

			res.json({
				success: true,
				data: records,
				pagination: {
					current: parseInt(page),
					pages: Math.ceil(total / parseInt(limit)),
					total,
					limit: parseInt(limit),
				},
			});
		} catch (error) {
			console.error("Error searching medical records:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi tìm kiếm hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 8. Xóa hồ sơ y tế (chỉ admin)
router.delete(
	"/:id",
	authenticateToken,
	authorize(["admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;

			const record = await MedicalRecord.findById(id);

			if (!record) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Create delete block before deleting record
			try {
				const latestBlock = await Block.findOne().sort({ index: -1 });
				const previousHash = latestBlock ? latestBlock.hash : "0";
				const newIndex = latestBlock ? latestBlock.index + 1 : 0;

				const deleteBlock = new Block({
					index: newIndex,
					timestamp: new Date(),
					data: {
						recordId: record._id,
						patientId: record.patientId,
						doctorId: record.doctorId,
						diagnosis: record.diagnosis,
						treatment: record.treatment,
						medication: record.medication,
						doctorNote: record.doctorNote,
						dateBack: record.dateBack,
						action: "delete",
					},
					previousHash: previousHash,
				});

				deleteBlock.hash = Block.calculateHash(
					deleteBlock.index,
					deleteBlock.timestamp,
					deleteBlock.data,
					deleteBlock.previousHash
				);

				await deleteBlock.save();
				console.log(
					`✅ Delete block ${newIndex} created for medical record ${record._id}`
				);
			} catch (blockError) {
				console.error("Error creating delete block:", blockError);
			}

			await MedicalRecord.findByIdAndDelete(id);

			res.json({
				success: true,
				message: "Xóa hồ sơ y tế thành công",
			});
		} catch (error) {
			console.error("Error deleting medical record:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi xóa hồ sơ y tế",
				error: error.message,
			});
		}
	}
);

// 9. Lấy tất cả hồ sơ (chỉ admin) - với phân trang
router.get("/", authenticateToken, authorize(["admin"]), async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const skip = (page - 1) * limit;

		const total = await MedicalRecord.countDocuments();
		const records = await MedicalRecord.find()
			.populate("patientId", "name email")
			.populate("doctorId", "name email")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		res.json({
			success: true,
			data: records,
			pagination: {
				current: page,
				pages: Math.ceil(total / limit),
				total,
				limit,
			},
		});
	} catch (error) {
		console.error("Error getting all records:", error);
		res.status(500).json({
			success: false,
			message: "Lỗi lấy danh sách hồ sơ y tế",
			error: error.message,
		});
	}
});

// 10. Verify blockchain integrity
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

// 11. Get blockchain history for a specific medical record
router.get(
	"/:id/history",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;

			const record = await MedicalRecord.findById(id);
			if (!record) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			const history = await record.getBlockchainHistory();

			res.json({
				success: true,
				message: "Lịch sử blockchain của hồ sơ y tế",
				data: {
					recordId: id,
					history: history,
				},
			});
		} catch (error) {
			console.error("Error getting blockchain history:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy lịch sử blockchain",
				error: error.message,
			});
		}
	}
);

// 12. Get appointments by doctor ID
router.get(
	"/appointments/doctor/:doctorId",
	authenticateToken,
	authorize(["doctor", "admin"]),
	async (req, res) => {
		try {
			const { doctorId } = req.params;

			const appointments = await MedicalRecord.getUpcomingAppointments(doctorId);

			res.json({
				success: true,
				data: appointments,
				total: appointments.length,
			});
		} catch (error) {
			console.error("Error getting doctor appointments:", error);
			res.status(500).json({
				success: false,
				message: "Lỗi lấy hồ sơ bác sĩ",
				error: error.message,
			});
		}
	}
);

module.exports = router;
