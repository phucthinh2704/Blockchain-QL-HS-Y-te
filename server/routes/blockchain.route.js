const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middlewares/auth");
const Block = require("../models/Block");
const MedicalRecord = require("../models/MedicalRecord");

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
			const latestBlock = await Block.getLatestBlock();
			const genesisBlock = await Block.findOne({ index: 0 });

			res.json({
				success: true,
				data: {
					totalBlocks,
					latestBlock: latestBlock
						? {
								index: latestBlock.index,
								timestamp: latestBlock.timestamp,
								hash: latestBlock.hash,
						  }
						: null,
					genesisBlock: genesisBlock
						? {
								index: genesisBlock.index,
								timestamp: genesisBlock.timestamp,
								hash: genesisBlock.hash,
						  }
						: null,
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
	authorize(["doctor", "admin"]),
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
				.populate("data.recordId");

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
			const limit = parseInt(req.query.limit) || 10;
			const skip = (page - 1) * limit;

			const total = await Block.countDocuments();
			const blocks = await Block.find()
				.populate("data.patientId", "name email")
				.populate("data.doctorId", "name email")
				.sort({ index: -1 }) // Mới nhất trước
				.skip(skip)
				.limit(limit);

			res.json({
				success: true,
				data: blocks,
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

// 9. Xác thực một medical record cụ thể (patient có thể xem của mình)
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
			const block = await Block.findOne({ "data.recordId": recordId });
			if (!block) {
				return res.status(404).json({
					success: false,
					message: "Không tìm thấy block tương ứng",
				});
			}

			// Tính lại hash và so sánh
			const calculatedHash = Block.calculateHash(
				block.index,
				block.timestamp,
				block.data,
				block.previousHash
			);

			const isValid = calculatedHash === block.hash;

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

module.exports = router;
