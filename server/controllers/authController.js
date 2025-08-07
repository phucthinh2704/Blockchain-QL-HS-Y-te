const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ethers } = require("ethers");
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
		walletAddress: user.walletAddress,
		authMethod: user.authMethod,
	};

	const accessToken = jwt.sign(payload, JWT_SECRET, {
		expiresIn: JWT_EXPIRES_IN,
	});

	const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
		expiresIn: JWT_REFRESH_EXPIRES_IN,
	});

	return { accessToken, refreshToken };
};

// Verify wallet signature (simplified for demo)
const verifyWalletSignature = async (walletAddress, signature, message) => {
	try {		
		let recoveredAddress;
		
		// Try different methods based on ethers version
		if (ethers.verifyMessage) {
			// Ethers v6
			recoveredAddress = ethers.verifyMessage(message, signature);
		} else if (ethers.utils && ethers.utils.verifyMessage) {
			// Ethers v5
			recoveredAddress = ethers.utils.verifyMessage(message, signature);
		} else {
			throw new Error("No compatible ethers verification method found");
		}
		
		const isValid = recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
		
		return isValid;
	} catch (error) {
		console.error("Signature verification error:", error);
		return false;
	}
};

// Traditional login
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
			authMethod: "traditional",
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

		// Prepare user response
		const userResponse = {
			_id: user._id,
			email: user.email,
			name: user.name,
			role: user.role,
			phoneNumber: user.phoneNumber,
			dateOfBirth: user.dateOfBirth,
			authMethod: user.authMethod,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};

		// Set refresh token as httpOnly cookie
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(200).json({
			success: true,
			message: "Login successful",
			data: {
				user: userResponse,
				accessToken,
				refreshToken,
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

// Wallet login
const walletLogin = async (req, res) => {
	try {
		const { walletAddress, signature, message } = req.body;

		// Validation
		if (!walletAddress || !signature || !message) {
			return res.status(400).json({
				success: false,
				message: "Wallet address, signature, and message are required",
			});
		}

		// Validate wallet address format
		if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
			return res.status(400).json({
				success: false,
				message: "Invalid wallet address format",
			});
		}

		// Verify signature with enhanced logging
		const isValidSignature = await verifyWalletSignature(walletAddress, signature, message);
		
		if (!isValidSignature) {
			console.log("Signature verification failed");
			return res.status(401).json({
				success: false,
				message: "Invalid wallet signature",
				debug: {
					walletAddress,
					messageLength: message.length,
					signatureLength: signature.length
				}
			});
		}

		// Find user by wallet address
		const user = await User.findOne({
			walletAddress: walletAddress.toLowerCase(),
			authMethod: "wallet",
		});

		if (!user) {
			console.log("User not found for wallet:", walletAddress);
			return res.status(401).json({
				success: false,
				message: "Wallet not registered. Please register first.",
			});
		}

		console.log("User found:", user.name);

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(user);

		// Prepare user response
		const userResponse = {
			_id: user._id,
			name: user.name,
			role: user.role,
			phoneNumber: user.phoneNumber,
			dateOfBirth: user.dateOfBirth,
			walletAddress: user.walletAddress,
			authMethod: user.authMethod,
			isWalletVerified: user.isWalletVerified,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};

		// Set refresh token as httpOnly cookie
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		console.log("Wallet login successful for:", walletAddress);

		res.status(200).json({
			success: true,
			message: "Wallet login successful",
			data: {
				user: userResponse,
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		console.error("Wallet login error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
			error: error.message
		});
	}
};

// Get wallet login message (for signing)
const getWalletLoginMessage = async (req, res) => {
	try {
		const { walletAddress } = req.body;

		if (!walletAddress) {
			return res.status(400).json({
				success: false,
				message: "Wallet address is required",
			});
		}

		// Generate a simple message for signing
		const timestamp = Date.now();
		const message = `Sign this message to login to MedChain:\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

		res.status(200).json({
			success: true,
			data: {
				message,
				timestamp,
			},
		});
	} catch (error) {
		console.error("Get wallet message error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// Logout (unchanged)
const logout = async (req, res) => {
	try {
		const cookies = req.cookies;

		if (cookies.refreshToken) {
			res.clearCookie("refreshToken", {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
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

// Refresh token (updated to handle wallet users)
const refreshToken = async (req, res) => {
	try {
		const token = req.cookies.refreshToken || req.body.refreshToken;

		if (!token) {
			return res.status(401).json({
				success: false,
				message: "Refresh token is required",
			});
		}

		let decoded;
		try {
			decoded = jwt.verify(token, JWT_REFRESH_SECRET);
		} catch (error) {
			return res.status(401).json({
				success: false,
				message: "Invalid or expired refresh token",
			});
		}

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

		// Prepare user response based on auth method
		const userResponse = {
			_id: user._id,
			name: user.name,
			role: user.role,
			phoneNumber: user.phoneNumber,
			dateOfBirth: user.dateOfBirth,
			authMethod: user.authMethod,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};

		// Add method-specific fields
		if (user.authMethod === "traditional") {
			userResponse.email = user.email;
		} else {
			userResponse.walletAddress = user.walletAddress;
			userResponse.isWalletVerified = user.isWalletVerified;
		}

		// Set new refresh token as httpOnly cookie
		res.cookie("refreshToken", newRefreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
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

// Get wallet registration message (for signing)
const getWalletRegistrationMessage = async (req, res) => {
	try {
		const { walletAddress } = req.body;

		if (!walletAddress) {
			return res.status(400).json({
				success: false,
				message: "Wallet address is required",
			});
		}

		// Validate wallet address format
		if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
			return res.status(400).json({
				success: false,
				message: "Invalid wallet address format",
			});
		}

		// Generate a message for registration signing
		const timestamp = Date.now();
		const message = `Sign this message to register with MedChain:\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}\nAction: Registration\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

		res.status(200).json({
			success: true,
			data: {
				message,
				timestamp,
			},
		});
	} catch (error) {
		console.error("Get wallet registration message error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

const register = async (req, res) => {
	try {
		const { name, email, password, phoneNumber, dateOfBirth, role } =
			req.body;

		// Validation
		const newErrors = {};
		if (!name) newErrors.name = "Name is required";
		if (!email) newErrors.email = "Email is required";
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
			newErrors.email = "Invalid email format";
		if (!password) newErrors.password = "Password is required";
		else if (password.length < 6)
			newErrors.password = "Password must be at least 6 characters";

		if (Object.keys(newErrors).length > 0) {
			return res.status(400).json({
				success: false,
				message: "Validation errors",
				errors: newErrors,
			});
		}

		// Check if user already exists
		const existingUser = await User.findOne({
			email: email.toLowerCase().trim(),
			authMethod: "traditional",
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "Email already registered",
			});
		}

		// Hash password
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Create user
		const newUser = new User({
			name: name.trim(),
			email: email.toLowerCase().trim(),
			password: hashedPassword,
			phoneNumber: phoneNumber?.trim() || "",
			dateOfBirth: dateOfBirth || null,
			role: role || "patient",
			authMethod: "traditional",
			isEmailVerified: false,
		});

		await newUser.save();

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(newUser);

		// Prepare user response (exclude password)
		const userResponse = {
			_id: newUser._id,
			email: newUser.email,
			name: newUser.name,
			role: newUser.role,
			phoneNumber: newUser.phoneNumber,
			dateOfBirth: newUser.dateOfBirth,
			authMethod: newUser.authMethod,
			isEmailVerified: newUser.isEmailVerified,
			createdAt: newUser.createdAt,
			updatedAt: newUser.updatedAt,
		};

		// Set refresh token as httpOnly cookie
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(201).json({
			success: true,
			message: "Registration successful",
			data: {
				user: userResponse,
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		console.error("Register error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

// Wallet register
const walletRegister = async (req, res) => {
	try {
		const {
			name,
			phoneNumber,
			dateOfBirth,
			walletAddress,
			signature,
			message,
			role,
		} = req.body;

		// Validation
		const newErrors = {};
		if (!name) newErrors.name = "Name is required";
		if (!walletAddress)
			newErrors.walletAddress = "Wallet address is required";
		if (!signature) newErrors.signature = "Signature is required";
		if (!message) newErrors.message = "Message is required";

		// Validate wallet address format
		if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
			newErrors.walletAddress = "Invalid wallet address format";
		}

		if (Object.keys(newErrors).length > 0) {
			console.log("Validation errors:", newErrors);
			return res.status(400).json({
				success: false,
				message: "Validation errors",
				errors: newErrors,
			});
		}

		// Verify signature
		const isValidSignature = await verifyWalletSignature(
			walletAddress,
			signature,
			message
		);
		if (!isValidSignature) {
			return res.status(400).json({
				success: false,
				message:
					"Invalid wallet signature. Please try signing the message again.",
			});
		}

		// Check if wallet already exists
		const existingUser = await User.findOne({
			walletAddress: walletAddress.toLowerCase(),
			authMethod: "wallet",
		});

		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "Wallet address already registered",
			});
		}

		// Create user
		const newUser = new User({
			name: name.trim(),
			phoneNumber: phoneNumber?.trim() || "",
			dateOfBirth: dateOfBirth || null,
			walletAddress: walletAddress.toLowerCase(),
			role: role || "patient",
			authMethod: "wallet",
			isWalletVerified: true,
		});

		await newUser.save();

		// Generate tokens
		const { accessToken, refreshToken } = generateTokens(newUser);

		// Prepare user response
		const userResponse = {
			_id: newUser._id,
			name: newUser.name,
			role: newUser.role,
			phoneNumber: newUser.phoneNumber,
			dateOfBirth: newUser.dateOfBirth,
			walletAddress: newUser.walletAddress,
			authMethod: newUser.authMethod,
			isWalletVerified: newUser.isWalletVerified,
			createdAt: newUser.createdAt,
			updatedAt: newUser.updatedAt,
		};

		// Set refresh token as httpOnly cookie
		res.cookie("refreshToken", refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "none",
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});

		res.status(201).json({
			success: true,
			message: "Wallet registration successful",
			data: {
				user: userResponse,
				accessToken,
				refreshToken,
			},
		});
	} catch (error) {
		console.error("Wallet register error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

module.exports = {
	login,
	walletLogin,
	getWalletLoginMessage,
	getWalletRegistrationMessage,
	logout,
	refreshToken,
	register,
	walletRegister,
};
