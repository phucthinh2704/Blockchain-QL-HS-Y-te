const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_REFRESH_SECRET =
	process.env.JWT_REFRESH_SECRET || "your-refresh-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "2d";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

// Generate tokens
const generateTokens = (user) => {
	const payload = {
		userId: user._id,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwt.sign(payload, JWT_SECRET, {
		expiresIn: JWT_EXPIRES_IN,
	});

	const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
		expiresIn: JWT_REFRESH_EXPIRES_IN,
	});

	return { accessToken, refreshToken };
};

// Login user
const login = async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validation
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				message: "Email and password are required",
			});
		}

		// Email format validation
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: "Invalid email format",
			});
		}

		// Find user and include password for comparison
		const user = await User.findOne({
			email: email.toLowerCase().trim(),
		}).select("+password");

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			return res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});
		}

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user);

		// Prepare user response (exclude sensitive data)
		const userResponse = {
			_id: user._id,
			email: user.email,
			name: user.name,
			role: user.role,
			phoneNumber: user.phoneNumber,
			dateOfBirth: user.dateOfBirth,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};

		// Set refresh token as httpOnly cookie (optional - for better security)
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(200).json({
			success: true,
			message: "Login successful",
			data: {
				user: userResponse,
				accessToken,
				refreshToken, // Có thể bỏ nếu dùng cookie
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// Logout
const logout = async (req, res) => {
	try {
		const cookies = req.cookies;

		if (cookies.refreshToken) {
			res.clearCookie("refreshToken", {
				httpOnly: true,
				secure: true,
				sameSite: "none",
			});
		}

		return res.json({
			success: true,
			message: "Logout successful",
		});
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
};

// Refresh token
const refreshToken = async (req, res) => {
	try {
		// Lấy refresh token từ cookie hoặc body
		const token = req.cookies.refreshToken || req.body.refreshToken;

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Refresh token is required",
			});
		}

		// Verify refresh token
		let decoded;
		try {
			decoded = jwt.verify(
				token,
				JWT_REFRESH_SECRET || "your-refresh-secret"
			);
		} catch (error) {
			return res.status(401).json({
				success: false,
				message: "Invalid or expired refresh token",
			});
		}

		// Find user
		const user = await User.findById(decoded.userId);

		if (!user) {
			return res.status(401).json({
				success: false,
				message: "User not found",
			});
		}

		// Generate new tokens
		const { accessToken, refreshToken: newRefreshToken } =
			generateTokens(user);

		// Prepare user response
		const userResponse = {
			_id: user._id,
			email: user.email,
			name: user.name,
			role: user.role,
			phoneNumber: user.phoneNumber,
			dateOfBirth: user.dateOfBirth,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};

		// Set new refresh token as httpOnly cookie
		res.cookie("refreshToken", newRefreshToken, {
			httpOnly: true,
			secure: true,
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(200).json({
			success: true,
			message: "Token refreshed successfully",
			data: {
				user: userResponse,
				accessToken,
				refreshToken: newRefreshToken,
			},
		});
	} catch (error) {
		console.error("Refresh token error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

module.exports = {
	login,
	logout,
	refreshToken,
};
