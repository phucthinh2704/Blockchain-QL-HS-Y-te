const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Traditional auth routes
router.post("/login", authController.login);
router.post("/register", authController.register);

// Wallet auth routes
router.post("/wallet-login", authController.walletLogin);
router.post("/wallet-register", authController.walletRegister);
router.post("/wallet-message", authController.getWalletLoginMessage);
router.post("/wallet-register-message", authController.getWalletRegistrationMessage);

// Common routes
router.post("/logout", authController.logout);
router.post("/refresh-token", authController.refreshToken);

module.exports = router;