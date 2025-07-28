const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middlewares/auth");
const userController = require("../controllers/userController");

// Public route - Đăng ký user mới
router.post("/register", userController.registerUser);

// Admin only - Lấy danh sách tất cả user
router.get("/", authenticateToken, authorize(["admin"]), userController.getUsers);

// Roles: patient, doctor, admin - Lấy danh sách bác sĩ
router.get("/doctors", authenticateToken, authorize(["doctor", "admin"]), userController.getDoctors);

// Roles: doctor, admin - Lấy danh sách bệnh nhân
router.get("/patients", authenticateToken, authorize(["doctor", "admin"]), userController.getPatients);

// Roles: tất cả - Xem thông tin cá nhân hoặc người khác (nếu là admin)
router.get("/:userId", authenticateToken, authorize(["patient", "doctor", "admin"]), userController.getUserById);

// Roles: tự cập nhật hoặc admin
router.put("/:userId", authenticateToken, authorize(["patient", "doctor", "admin"]), userController.updateUser);

// Admin only - Xóa user
router.delete("/:userId", authenticateToken, authorize(["admin"]), userController.deleteUser);

module.exports = router;
