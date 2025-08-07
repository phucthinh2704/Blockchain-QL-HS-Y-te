const express = require("express");
const router = express.Router();
const { authenticateToken, authorize } = require("../middlewares/auth");
const userController = require("../controllers/userController");

// Public routes - User registration
router.post("/register", userController.registerUser);
router.post("/register-wallet", userController.registerWalletUser);

// Admin only - Get all users with filtering and pagination
router.get("/", 
	authenticateToken, 
	authorize(["admin"]), 
	userController.getUsers
);

// All authenticated users - Get doctors list
router.get("/doctors", 
	authenticateToken, 
	authorize(["patient", "doctor", "admin"]), 
	userController.getDoctors
);

// Doctor and Admin - Get patients list
router.get("/patients", 
	authenticateToken, 
	authorize(["doctor", "admin"]), 
	userController.getPatients
);

// All authenticated users - Get user by ID (with access control)
router.get("/:userId", 
	authenticateToken, 
	authorize(["patient", "doctor", "admin"]), 
	userController.getUserById
);

// Self or Admin - Update user information
router.put("/:userId", 
	authenticateToken, 
	authorize(["patient", "doctor", "admin"]), 
	userController.updateUser
);

// Admin only - Delete user
router.delete("/:userId", 
	authenticateToken, 
	authorize(["admin"]), 
	userController.deleteUser
);

module.exports = router;