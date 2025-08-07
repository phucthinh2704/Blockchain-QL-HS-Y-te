// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { ethers } = require("ethers");

// Helper function to validate wallet address
const isValidWalletAddress = (address) => {
	return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Helper function to verify wallet signature
const verifyWalletSignature = async (walletAddress, signature, message) => {
	try {
		const recoveredAddress = ethers.utils.verifyMessage(message, signature);
		return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
	} catch (error) {
		console.error("Signature verification error:", error);
		return false;
	}
};

// 1. Register new user (Traditional)
const registerUser = async (req, res) => {
	try {
		const { email, password, name, role, phoneNumber, dateOfBirth } = req.body;

		// Validate required fields for traditional registration
		if (!email || !password || !name || !role) {
			return res.status(400).json({
				success: false,
				message: "Missing required fields: email, password, name, role",
			});
		}

		// Validate role
		if (!["patient", "doctor", "admin"].includes(role)) {
			return res.status(400).json({
				success: false,
				message: "Invalid role. Only accepts: patient, doctor, admin",
			});
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({
				success: false,
				message: "Invalid email format",
			});
		}

		// Check if email already exists
		const existingUser = await User.findOne({ 
			email: email.toLowerCase().trim() 
		});
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "Email already in use",
			});
		}

		// Hash password
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Prepare user data
		const userData = {
			email: email.toLowerCase().trim(),
			password: hashedPassword,
			name: name.trim(),
			role,
			authMethod: "traditional"
		};

		// Add optional fields
		if (phoneNumber) {
			if (!/^\d{10,15}$/.test(phoneNumber)) {
				return res.status(400).json({
					success: false,
					message: "Invalid phone number format",
				});
			}
			userData.phoneNumber = phoneNumber.trim();
		}

		if (dateOfBirth) {
			const birthDate = new Date(dateOfBirth);
			const today = new Date();
			if (isNaN(birthDate.getTime()) || birthDate >= today) {
				return res.status(400).json({
					success: false,
					message: "Invalid date of birth",
				});
			}
			userData.dateOfBirth = birthDate;
		}

		const user = new User(userData);
		await user.save();

		// Prepare response (exclude password)
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

		res.status(201).json({
			success: true,
			message: "Registration successful",
			data: userResponse,
		});
	} catch (error) {
		console.error("Register error:", error);

		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({
				success: false,
				message: "Validation error",
				errors: messages,
			});
		}

		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "Email already in use",
			});
		}

		res.status(500).json({
			success: false,
			message: "Internal server error during registration",
		});
	}
};

// 2. Register wallet user
const registerWalletUser = async (req, res) => {
	try {
		const { walletAddress, signature, message, name, role, phoneNumber, dateOfBirth } = req.body;

		// Validate required fields
		if (!walletAddress || !signature || !message || !name || !role) {
			return res.status(400).json({
				success: false,
				message: "Missing required fields: walletAddress, signature, message, name, role",
			});
		}

		// Validate role
		if (!["patient", "doctor", "admin"].includes(role)) {
			return res.status(400).json({
				success: false,
				message: "Invalid role. Only accepts: patient, doctor, admin",
			});
		}

		// Validate wallet address format
		if (!isValidWalletAddress(walletAddress)) {
			return res.status(400).json({
				success: false,
				message: "Invalid wallet address format",
			});
		}

		// Verify wallet signature
		const isValidSignature = await verifyWalletSignature(walletAddress, signature, message);
		if (!isValidSignature) {
			return res.status(401).json({
				success: false,
				message: "Invalid wallet signature",
			});
		}

		// Check if wallet already exists
		const existingUser = await User.findOne({ 
			walletAddress: walletAddress.toLowerCase() 
		});
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "Wallet address already registered",
			});
		}

		// Prepare user data
		const userData = {
			walletAddress: walletAddress.toLowerCase(),
			name: name.trim(),
			role,
			authMethod: "wallet",
			isWalletVerified: true
		};

		// Add optional fields
		if (phoneNumber) {
			if (!/^\d{10,15}$/.test(phoneNumber)) {
				return res.status(400).json({
					success: false,
					message: "Invalid phone number format",
				});
			}
			userData.phoneNumber = phoneNumber.trim();
		}

		if (dateOfBirth) {
			const birthDate = new Date(dateOfBirth);
			const today = new Date();
			if (isNaN(birthDate.getTime()) || birthDate >= today) {
				return res.status(400).json({
					success: false,
					message: "Invalid date of birth",
				});
			}
			userData.dateOfBirth = birthDate;
		}

		const user = new User(userData);
		await user.save();

		// Prepare response
		const userResponse = {
			_id: user._id,
			walletAddress: user.walletAddress,
			name: user.name,
			role: user.role,
			phoneNumber: user.phoneNumber,
			dateOfBirth: user.dateOfBirth,
			authMethod: user.authMethod,
			isWalletVerified: user.isWalletVerified,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		};

		res.status(201).json({
			success: true,
			message: "Wallet registration successful",
			data: userResponse,
		});
	} catch (error) {
		console.error("Wallet register error:", error);

		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({
				success: false,
				message: "Validation error",
				errors: messages,
			});
		}

		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "Wallet address already registered",
			});
		}

		res.status(500).json({
			success: false,
			message: "Internal server error during wallet registration",
		});
	}
};

// 3. Get all users (Admin only)
const getUsers = async (req, res) => {
	try {
		const { role, authMethod, page = 1, limit = 10, search } = req.query;

		// Build filter
		const filter = {};
		if (role && ["patient", "doctor", "admin"].includes(role)) {
			filter.role = role;
		}
		if (authMethod && ["traditional", "wallet"].includes(authMethod)) {
			filter.authMethod = authMethod;
		}
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ email: { $regex: search, $options: 'i' } },
				{ walletAddress: { $regex: search, $options: 'i' } }
			];
		}

		// Pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Get users with appropriate fields based on auth method
		const users = await User.find(filter)
			.select("-password")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit));

		// Get total count
		const total = await User.countDocuments(filter);

		res.json({
			success: true,
			data: {
				users,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(total / parseInt(limit)),
					totalUsers: total,
					limit: parseInt(limit),
				},
			},
		});
	} catch (error) {
		console.error("Get users error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching users",
		});
	}
};

// 4. Get doctors list (Patient, Doctor, Admin)
const getDoctors = async (req, res) => {
	try {
		const doctors = await User.find({ role: "doctor" })
			.select("name email walletAddress phoneNumber authMethod createdAt")
			.sort({ name: 1 });

		res.json({
			success: true,
			data: doctors,
			total: doctors.length,
		});
	} catch (error) {
		console.error("Get doctors error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching doctors list",
		});
	}
};

// 5. Get patients list (Doctor, Admin)
const getPatients = async (req, res) => {
	try {
		const patients = await User.find({ role: "patient" })
			.select("name email walletAddress phoneNumber dateOfBirth authMethod createdAt")
			.sort({ name: 1 });

		res.json({
			success: true,
			data: patients,
			total: patients.length,
		});
	} catch (error) {
		console.error("Get patients error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching patients list",
		});
	}
};

// 6. Get user by ID (All authenticated users)
const getUserById = async (req, res) => {
	try {
		const { userId } = req.params;

		// Validate ObjectId format
		if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				success: false,
				message: "Invalid user ID format",
			});
		}

		const user = await User.findById(userId).select("-password");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Access control
		let responseData = {};

		if (req.user.role === "admin") {
			// Admin can see all information
			responseData = user.toObject();
		} else if (req.user.userId === userId) {
			// User viewing their own profile
			responseData = user.toObject();
		} else {
			// Basic information for other users
			responseData = {
				_id: user._id,
				name: user.name,
				role: user.role,
				phoneNumber: user.phoneNumber,
				authMethod: user.authMethod,
			};

			// Add auth-method specific fields
			if (user.authMethod === "traditional") {
				responseData.email = user.email;
			} else {
				responseData.walletAddress = user.walletAddress;
			}

			// Doctor can see patient's date of birth
			if (user.role === "patient" && req.user.role === "doctor") {
				responseData.dateOfBirth = user.dateOfBirth;
			}
		}

		res.json({
			success: true,
			data: responseData,
		});
	} catch (error) {
		console.error("Get user by ID error:", error);
		res.status(500).json({
			success: false,
			message: "Error fetching user information",
		});
	}
};

// 7. Update user (Self or Admin)
const updateUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { email, name, phoneNumber, dateOfBirth } = req.body;

		// Access control
		if (req.user.role !== "admin" && userId !== req.user.userId) {
			return res.status(403).json({
				success: false,
				message: "You can only update your own information",
			});
		}

		// Find current user
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({
				success: false,
				message: "User not found",
			});
		}

		// Prepare update data
		const updateData = {};

		// Update email (only for traditional auth users)
		if (email !== undefined && currentUser.authMethod === "traditional") {
			const trimmedEmail = email.trim().toLowerCase();

			if (trimmedEmail) {
				// Validate email format
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(trimmedEmail)) {
					return res.status(400).json({
						success: false,
						message: "Invalid email format",
					});
				}

				// Check if email is different and not already used
				if (trimmedEmail !== currentUser.email) {
					const existingUser = await User.findOne({
						email: trimmedEmail,
						_id: { $ne: userId },
					});

					if (existingUser) {
						return res.status(400).json({
							success: false,
							message: "Email already in use by another user",
						});
					}

					updateData.email = trimmedEmail;
				}
			}
		}

		// Update name
		if (name !== undefined && name.trim()) {
			updateData.name = name.trim();
		}

		// Update phone number
		if (phoneNumber !== undefined) {
			const trimmedPhone = phoneNumber.trim();
			if (trimmedPhone) {
				if (!/^\d{10,15}$/.test(trimmedPhone)) {
					return res.status(400).json({
						success: false,
						message: "Invalid phone number format",
					});
				}
				updateData.phoneNumber = trimmedPhone;
			} else {
				updateData.phoneNumber = null;
			}
		}

		// Update date of birth
		if (dateOfBirth !== undefined) {
			if (dateOfBirth) {
				const birthDate = new Date(dateOfBirth);
				const today = new Date();
				if (isNaN(birthDate.getTime()) || birthDate >= today) {
					return res.status(400).json({
						success: false,
						message: "Invalid date of birth",
					});
				}
				updateData.dateOfBirth = birthDate;
			} else {
				updateData.dateOfBirth = null;
			}
		}

		// Check if there's data to update
		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "No data to update",
			});
		}

		// Update user
		const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
			new: true,
			runValidators: true,
		}).select("-password");

		if (!updatedUser) {
			return res.status(404).json({
				success: false,
				message: "User not found for update",
			});
		}

		res.json({
			success: true,
			message: "User information updated successfully",
			data: updatedUser,
		});
	} catch (error) {
		console.error("Update user error:", error);

		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map(err => err.message);
			return res.status(400).json({
				success: false,
				message: "Validation error",
				errors: messages,
			});
		}

		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "Email already in use by another user",
			});
		}

		res.status(500).json({
			success: false,
			message: "Error updating user information",
		});
	}
};

// 8. Delete user (Admin only)
const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;

		// Validate ObjectId format
		if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				success: false,
				message: "Invalid user ID format",
			});
		}

		// Prevent admin from deleting themselves
		if (userId === req.user.userId) {
			return res.status(400).json({
				success: false,
				message: "Cannot delete your own account",
			});
		}

		const user = await User.findByIdAndDelete(userId).select("-password");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "User not found for deletion",
			});
		}

		// Prepare deleted user info for response
		const deletedUserInfo = {
			_id: user._id,
			name: user.name,
			role: user.role,
			authMethod: user.authMethod,
		};

		if (user.authMethod === "traditional") {
			deletedUserInfo.email = user.email;
		} else {
			deletedUserInfo.walletAddress = user.walletAddress;
		}

		res.json({
			success: true,
			message: "User deleted successfully",
			data: {
				deletedUser: deletedUserInfo,
			},
		});
	} catch (error) {
		console.error("Delete user error:", error);
		res.status(500).json({
			success: false,
			message: "Error deleting user",
		});
	}
};

module.exports = {
	registerUser,
	registerWalletUser,
	getUsers,
	getDoctors,
	getPatients,
	getUserById,
	updateUser,
	deleteUser,
};