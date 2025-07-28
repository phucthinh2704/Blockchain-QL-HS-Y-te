// controllers/userController.js
const User = require("../models/User");
const bcrypt = require("bcrypt");

// 1. Đăng ký người dùng mới (Public)
const registerUser = async (req, res) => {
	try {
		const { email, password, name, role, phoneNumber, dateOfBirth } =
			req.body;

		// Kiểm tra thông tin bắt buộc
		if (
			!email ||
			!password ||
			!name ||
			!role ||
			!phoneNumber ||
			!dateOfBirth
		) {
			return res.status(400).json({
				success: false,
				message:
					"Thiếu thông tin bắt buộc: email, password, name, role, phoneNumber, dateOfBirth",
			});
		}

		// Validate role
		if (!["patient", "doctor", "admin"].includes(role)) {
			return res.status(400).json({
				success: false,
				message:
					"Role không hợp lệ. Chỉ chấp nhận: patient, doctor, admin",
			});
		}

		// Kiểm tra email đã tồn tại
		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({
				success: false,
				message: "Email đã được sử dụng",
			});
		}

		// Hash password
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);

		// Tạo user mới
		const userData = {
			email: email.toLowerCase().trim(),
			password: hashedPassword,
			name: name.trim(),
			role,
		};

		// Thêm thông tin tùy chọn
		if (phoneNumber) {
			if (!/^\d{10,15}$/.test(phoneNumber)) {
				return res.status(400).json({
					success: false,
					message: "Số điện thoại không hợp lệ",
				});
			}
			userData.phoneNumber = phoneNumber.trim();
		}
		if (dateOfBirth) {
			if (
				!Date.parse(dateOfBirth) ||
				dateOfBirth < "1900-01-01" ||
				dateOfBirth > new Date().toISOString().split("T")[0]
			) {
				return res.status(400).json({
					success: false,
					message: "Ngày sinh không hợp lệ",
				});
			}
			userData.dateOfBirth = new Date(dateOfBirth);
		}

		const user = new User(userData);
		await user.save();

		// Trả về thông tin user (không bao gồm password)
		const userResponse = user.toObject();
		delete userResponse.password;

		res.status(201).json({
			success: true,
			message: "Đăng ký thành công",
			data: userResponse,
		});
	} catch (error) {
		console.error("Register error:", error);

		// Handle validation errors
		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map(
				(err) => err.message
			);
			return res.status(400).json({
				success: false,
				message: "Lỗi validation",
				errors: messages,
			});
		}

		// Handle duplicate key error
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "Email đã được sử dụng",
			});
		}

		res.status(500).json({
			success: false,
			message: "Lỗi server khi đăng ký người dùng",
			error: error.message,
		});
	}
};

// 2. Lấy danh sách tất cả users (Admin only)
const getUsers = async (req, res) => {
	try {
		const { role, page = 1, limit = 10 } = req.query;

		// Build filter
		const filter = {};
		if (role && ["patient", "doctor", "admin"].includes(role)) {
			filter.role = role;
		}

		// Pagination
		const skip = (parseInt(page) - 1) * parseInt(limit);

		// Get users
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
			message: "Lỗi lấy danh sách người dùng",
			error: error.message,
		});
	}
};

// 3. Lấy danh sách bác sĩ (Patient, Doctor, Admin)
const getDoctors = async (req, res) => {
	try {
		const doctors = await User.find({ role: "doctor" })
			.select("name email phoneNumber createdAt")
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
			message: "Lỗi lấy danh sách bác sĩ",
			error: error.message,
		});
	}
};

// 4. Lấy danh sách bệnh nhân (Doctor, Admin)
const getPatients = async (req, res) => {
	try {
		const patients = await User.find({ role: "patient" })
			.select("name email phoneNumber dateOfBirth createdAt")
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
			message: "Lỗi lấy danh sách bệnh nhân",
			error: error.message,
		});
	}
};

// 5. Lấy thông tin user theo ID (All authenticated users)
const getUserById = async (req, res) => {
	try {
		const { userId } = req.params;

		// Validate ObjectId format
		if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				success: false,
				message: "ID người dùng không hợp lệ",
			});
		}

		const user = await User.findById(userId).select("-password");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy người dùng",
			});
		}

		// Kiểm tra quyền truy cập
		// Admin có thể xem tất cả
		// User chỉ có thể xem thông tin của chính họ
		// Doctor/Patient có thể xem thông tin cơ bản của nhau
		let responseData = {};

		if (req.user.role === "admin") {
			// Admin xem được tất cả thông tin
			responseData = user.toObject();
		} else if (req.user.userId === userId) {
			// User xem thông tin của chính họ
			responseData = user.toObject();
		} else {
			// Xem thông tin cơ bản của user khác
			responseData = {
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
				phoneNumber: user.phoneNumber,
			};

			// Nếu là patient thì doctor có thể xem thêm dateOfBirth
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
			message: "Lỗi lấy thông tin người dùng",
			error: error.message,
		});
	}
};

// 6. Cập nhật thông tin user (User tự cập nhật hoặc Admin)
const updateUser = async (req, res) => {
	try {
		const { userId } = req.params;
		const { email, name, phoneNumber } = req.body;

		// Kiểm tra quyền: user chỉ được cập nhật thông tin của chính họ (trừ admin)
		if (req.user.role !== "admin" && userId !== req.user.userId) {
			return res.status(403).json({
				success: false,
				message: "Bạn chỉ có thể cập nhật thông tin của chính mình",
			});
		}

		// Tìm user hiện tại
		const currentUser = await User.findById(userId);
		if (!currentUser) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy người dùng",
			});
		}

		// Chuẩn bị dữ liệu cập nhật
		const updateData = {};

		// Cập nhật email (kiểm tra unique nếu có thay đổi)
		if (email !== undefined && email.trim()) {
			const trimmedEmail = email.trim().toLowerCase();

			// Kiểm tra định dạng email
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(trimmedEmail)) {
				return res.status(400).json({
					success: false,
					message: "Email không hợp lệ",
				});
			}

			// Kiểm tra nếu email mới khác với email hiện tại
			if (trimmedEmail !== currentUser.email) {
				// Kiểm tra email đã tồn tại chưa
				const existingUser = await User.findOne({
					email: trimmedEmail,
					_id: { $ne: userId }, // Loại trừ user hiện tại
				});

				if (existingUser) {
					return res.status(400).json({
						success: false,
						message: "Email đã được sử dụng bởi người dùng khác",
					});
				}

				updateData.email = trimmedEmail;
			}
		}

		// Cập nhật name
		if (name !== undefined && name.trim()) {
			updateData.name = name.trim();
		}

		// Cập nhật phoneNumber
		if (phoneNumber !== undefined) {
			const trimmedPhone = phoneNumber.trim();
			const phoneRegex = /^0\d{9}$/; // Ví dụ: 10 số, bắt đầu bằng 0 (ở VN)
			if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
				return res.status(400).json({
					success: false,
					message: "Số điện thoại không hợp lệ",
				});
			}
			updateData.phoneNumber = trimmedPhone || null;
		}

		// Kiểm tra có dữ liệu để cập nhật không
		if (Object.keys(updateData).length === 0) {
			return res.status(400).json({
				success: false,
				message: "Không có dữ liệu để cập nhật",
			});
		}

		// Cập nhật user
		const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
			new: true,
			runValidators: true,
			context: "query",
		}).select("-password");

		if (!updatedUser) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy người dùng để cập nhật",
			});
		}

		res.json({
			success: true,
			message: "Cập nhật thông tin thành công",
			data: updatedUser,
		});
	} catch (error) {
		console.error("Update user error:", error);

		if (error.name === "ValidationError") {
			const messages = Object.values(error.errors).map(
				(err) => err.message
			);
			return res.status(400).json({
				success: false,
				message: "Lỗi validation",
				errors: messages,
			});
		}

		// Xử lý lỗi duplicate key (email đã tồn tại)
		if (error.code === 11000) {
			return res.status(400).json({
				success: false,
				message: "Email đã được sử dụng bởi người dùng khác",
			});
		}

		res.status(500).json({
			success: false,
			message: "Lỗi cập nhật thông tin người dùng",
			error: error.message,
		});
	}
};

// 7. Xóa user (Admin only)
const deleteUser = async (req, res) => {
	try {
		const { userId } = req.params;

		// Validate ObjectId format
		if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
			return res.status(400).json({
				success: false,
				message: "ID người dùng không hợp lệ",
			});
		}

		// Không cho phép admin tự xóa chính mình
		if (userId === req.user.userId) {
			return res.status(400).json({
				success: false,
				message: "Không thể xóa tài khoản của chính mình",
			});
		}

		const user = await User.findByIdAndDelete(userId).select("-password");

		if (!user) {
			return res.status(404).json({
				success: false,
				message: "Không tìm thấy người dùng để xóa",
			});
		}

		res.json({
			success: true,
			message: "Xóa người dùng thành công",
			data: {
				deletedUser: {
					_id: user._id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
			},
		});
	} catch (error) {
		console.error("Delete user error:", error);
		res.status(500).json({
			success: false,
			message: "Lỗi xóa người dùng",
			error: error.message,
		});
	}
};

module.exports = {
	registerUser,
	getUsers,
	getDoctors,
	getPatients,
	getUserById,
	updateUser,
	deleteUser,
};
