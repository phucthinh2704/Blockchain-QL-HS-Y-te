const express = require("express");
const router = express.Router();
const MedicalRecord = require("../models/MedicalRecord");
const Block = require("../models/Block");
const User = require("../models/User");
const { authenticateToken, authorize } = require("../middlewares/auth");

// routes/users.js
router.get("/patients", authenticateToken, authorize(["doctor", "admin"]), async (req, res) => {
	try {
		const patients = await User.find({ role: "patient" })
			.select("name email phoneNumber walletAddress")
			.sort({ name: 1 });

		res.json({
			success: true,
			data: patients
		});
	} catch (error) {
		console.error("Error getting patients:", error);
		res.status(500).json({
			success: false,
			message: "Lỗi lấy danh sách bệnh nhân"
		});
	}
});

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
		await medicalRecord.populate("patientId", "name email walletAddress phoneNumber");
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
				.populate("patientId", "name email phoneNumber walletAddress")
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
			const { diagnosis, treatment, medication, doctorNote, dateBack, status } = req.body;
			
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
			if (status !== undefined) updateData.status = status;

			// QUAN TRỌNG: Chỉ tìm record, KHÔNG update trước
			const record = await MedicalRecord.findById(id)
				.populate("patientId", "_id name email phoneNumber walletAddress")
				.populate("doctorId", "_id name email");

			if (!record) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy hồ sơ y tế",
				});
			}

			// Gọi updateWithBlockchain - sẽ tự động update record và tạo block
			const updatedRecord = await record.updateWithBlockchain(
				updateData,
				req.user.userId
			);

			// Populate lại để trả về đầy đủ thông tin
			await updatedRecord.populate([
				{ path: "patientId", select: "name email phoneNumber" },
				{ path: "doctorId", select: "name email" }
			]);

			return res.status(200).json({
				success: true,
				message: "Cập nhật hồ sơ y tế thành công",
				data: updatedRecord,
			});
		} catch (error) {
			console.error("❌ Error updating medical record:", error);
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
				.populate("patientId", "-password")
				.populate("doctorId", "-password")
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
				.populate("patientId", "name email phoneNumber walletAddress")
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

// 9. Lấy tất cả hồ sơ (chỉ admin) - với phân trang
router.get("/", authenticateToken, authorize(["admin"]), async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 9999;
		const skip = (page - 1) * limit;

		const total = await MedicalRecord.countDocuments();
		const records = await MedicalRecord.find()
			.populate("patientId", "name email walletAddress")
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

			const appointments = await MedicalRecord.getUpcomingAppointments(
				doctorId
			);

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

// 13. Share medical record with another doctor or user
router.post("/:id/share", async (req, res) => {
	const user = req.user;
	const { userId, role } = req.body;

	const record = await MedicalRecord.findById(req.params.id);
	if (!record)
		return res.status(404).json({ message: "Không tìm thấy hồ sơ" });

	if (record.patientId.toString() !== user._id) {
		return res
			.status(403)
			.json({ message: "Bạn không có quyền chia sẻ hồ sơ này" });
	}

	// Không thêm trùng
	const alreadyShared = record.sharedWith.some(
		(entry) => entry.userId.toString() === userId
	);
	if (alreadyShared) {
		return res
			.status(400)
			.json({ message: "Người này đã được chia sẻ rồi" });
	}

	record.sharedWith.push({ userId, role: role || "read" });
	await record.save();

	res.json({ message: "Đã chia sẻ hồ sơ", record });
});

module.exports = router;
