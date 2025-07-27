const express = require("express");
const router = express.Router();
const MedicalRecord = require("../models/MedicalRecord");
const Block = require("../models/Block");
const medicalController = require("../controllers/medicalRecordController");
const { authenticateToken, authorize } = require("../middlewares/auth");

// 1. Tạo hồ sơ y tế mới (chỉ doctor)
router.post("/", authenticateToken, authorize(["doctor"]), async (req, res) => {
	try {
		const { patientId, diagnosis, treatment } = req.body;
		const doctorId = req.user.userId;

		// Validate input
		if (!patientId || !diagnosis) {
			return res.status(400).json({
				success: false,
				message: "Thiếu thông tin bắt buộc (patientId, diagnosis)",
			});
		}

		// Tạo medical record (blockchain sẽ được tự động tạo trong middleware)
		const medicalRecord = new MedicalRecord({
			patientId,
			doctorId,
			diagnosis,
			treatment: treatment || "",
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
			const { diagnosis, treatment } = req.body;

			const record = await MedicalRecord.findByIdAndUpdate(
				id,
				{
					diagnosis,
					treatment,
				},
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

			// Tìm block cuối cùng
			const latestBlock = await Block.findOne().sort({ index: -1 });
			const previousHash = latestBlock ? latestBlock.hash : "0";
			const newIndex = latestBlock ? latestBlock.index + 1 : 0;

			// SỬ DỤNG Date OBJECT THAY VÌ Date.now()
			const updateBlock = new Block({
				index: newIndex,
				timestamp: new Date(), // ✅ Sử dụng Date object thay vì Date.now()
				data: {
					recordId: record._id,
					// Đảm bảo lấy ObjectId từ populated fields
					patientId: record.patientId._id || record.patientId,
					doctorId: record.doctorId._id || record.doctorId,
					diagnosis: record.diagnosis,
					treatment: record.treatment,
					action: "update", // Đánh dấu là update
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
				.populate("patientId", "name email phoneNumber")
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

// 6. Xóa hồ sơ y tế (chỉ admin)
router.delete(
	"/:id",
	authenticateToken,
	authorize(["admin"]),
	async (req, res) => {
		try {
			const { id } = req.params;

			const record = await MedicalRecord.findByIdAndDelete(id);

			if (!record) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

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

// 7. Lấy tất cả hồ sơ (chỉ admin) - với phân trang
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

module.exports = router;
