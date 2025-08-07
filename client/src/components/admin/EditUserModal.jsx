import React, { useState, useEffect } from "react";
import {
	X,
	Save,
	AlertCircle,
	User,
	Mail,
	Phone,
	Calendar,
	Shield,
	Wallet,
} from "lucide-react";

const EditUserModal = ({ user, isOpen, onClose, onSave }) => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phoneNumber: "",
		dateOfBirth: "",
		role: "patient",
		walletAddress: "",
		authMethod: "traditional",
		isWalletVerified: false,
	});

	const [errors, setErrors] = useState({});
	const [isLoading, setIsLoading] = useState(false);

	// Initialize form data when user prop changes
	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || "",
				email: user.email || "",
				phoneNumber: user.phoneNumber || "",
				dateOfBirth: user.dateOfBirth
					? user.dateOfBirth.split("T")[0]
					: "",
				role: user.role || "patient",
				walletAddress: user.walletAddress || "",
				authMethod: user.authMethod || "traditional",
				isWalletVerified: user.isWalletVerified || false,
			});
			setErrors({});
		}
	}, [user]);

	const validateForm = () => {
		const newErrors = {};

		// Name validation
		if (!formData.name.trim()) {
			newErrors.name = "Tên là bắt buộc";
		}

		// Email validation for traditional auth
		if (formData.authMethod === "traditional" && !formData.email.trim()) {
			newErrors.email =
				"Email là bắt buộc cho phương thức đăng nhập truyền thống";
		} else if (
			formData.email &&
			!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
		) {
			newErrors.email = "Email không hợp lệ";
		}

		// Wallet address validation
		if (
			formData.authMethod === "wallet" &&
			!formData.walletAddress.trim()
		) {
			newErrors.walletAddress =
				"Địa chỉ ví là bắt buộc cho phương thức đăng nhập ví";
		} else if (
			formData.walletAddress &&
			!/^0x[a-fA-F0-9]{40}$/.test(formData.walletAddress)
		) {
			newErrors.walletAddress =
				"Địa chỉ ví không hợp lệ (phải là địa chỉ Ethereum)";
		}

		// Phone validation
		if (
			formData.phoneNumber &&
			!/^\d{10,11}$/.test(formData.phoneNumber.replace(/\s/g, ""))
		) {
			newErrors.phoneNumber = "Số điện thoại phải có 10-11 chữ số";
		}

		// Date of birth validation
		if (formData.dateOfBirth) {
			const birthDate = new Date(formData.dateOfBirth);
			const today = new Date();
			if (birthDate > today) {
				newErrors.dateOfBirth = "Ngày sinh không thể là tương lai";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		setIsLoading(true);

		try {
			// Prepare data for submission
			const updateData = {
				...formData,
				_id: user._id,
			};

			// Remove empty fields
			Object.keys(updateData).forEach((key) => {
				if (updateData[key] === "") {
					delete updateData[key];
				}
			});

			await onSave(updateData);
			onClose();
		} catch (error) {
			console.error("Error updating user:", error);
			setErrors({
				general: "Có lỗi xảy ra khi cập nhật thông tin người dùng",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));

		// Clear error for this field when user starts typing
		if (errors[name]) {
			setErrors((prev) => ({ ...prev, [name]: "" }));
		}
	};

	const getRoleBadgeColor = (role) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-800";
			case "doctor":
				return "bg-blue-100 text-blue-800";
			default:
				return "bg-green-100 text-green-800";
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div className="flex items-center space-x-3">
						<div className="p-2 bg-blue-100 rounded-full">
							<User className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Chỉnh sửa thông tin người dùng
							</h2>
							<p className="text-sm text-gray-500">
								Cập nhật thông tin cho {user?.name}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors">
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				{/* Form */}
				<div className="p-6 space-y-6">
					{/* General Error */}
					{errors.general && (
						<div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
							<AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
							<span className="text-sm text-red-700">
								{errors.general}
							</span>
						</div>
					)}

					{/* Basic Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
							<User className="w-5 h-5" />
							<span>Thông tin cơ bản</span>
						</h3>

						{/* Name */}
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700 mb-1">
								Họ và tên *
							</label>
							<input
								type="text"
								id="name"
								name="name"
								value={formData.name}
								onChange={handleInputChange}
								className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
									errors.name
										? "border-red-300"
										: "border-gray-300"
								}`}
								placeholder="Nhập họ và tên"
							/>
							{errors.name && (
								<p className="mt-1 text-sm text-red-600">
									{errors.name}
								</p>
							)}
						</div>

						{/* Role */}
						<div>
							<label
								htmlFor="role"
								className="block text-sm font-medium text-gray-700 mb-1">
								Vai trò *
							</label>
							<div className="flex items-center space-x-3">
								<select
									id="role"
									name="role"
									value={formData.role}
									onChange={handleInputChange}
									className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
									<option value="patient">Bệnh nhân</option>
									<option value="doctor">Bác sĩ</option>
									<option value="admin">Quản trị viên</option>
								</select>
								<span
									className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
										formData.role
									)}`}>
									{formData.role === "admin"
										? "Quản trị viên"
										: formData.role === "doctor"
										? "Bác sĩ"
										: "Bệnh nhân"}
								</span>
							</div>
						</div>
					</div>

					{/* Authentication Method */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
							<Shield className="w-5 h-5" />
							<span>Phương thức xác thực</span>
						</h3>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Phương thức đăng nhập
							</label>
							<div className="space-y-2">
								<label className="flex items-center">
									<input
										type="radio"
										name="authMethod"
										value="traditional"
										checked={
											formData.authMethod ===
											"traditional"
										}
										onChange={handleInputChange}
										className="mr-2"
									/>
									<span className="text-sm">
										Truyền thống (Email/Password)
									</span>
								</label>
								<label className="flex items-center">
									<input
										type="radio"
										name="authMethod"
										value="wallet"
										checked={
											formData.authMethod === "wallet"
										}
										onChange={handleInputChange}
										className="mr-2"
									/>
									<span className="text-sm">Ví điện tử</span>
								</label>
							</div>
						</div>

						{/* Email - Traditional Auth */}
						{formData.authMethod === "traditional" && (
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700 mb-1">
									<div className="flex items-center space-x-1">
										<Mail className="w-4 h-4" />
										<span>Email *</span>
									</div>
								</label>
								<input
									type="email"
									id="email"
									name="email"
									value={formData.email}
									onChange={handleInputChange}
									className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
										errors.email
											? "border-red-300"
											: "border-gray-300"
									}`}
									placeholder="Nhập địa chỉ email"
								/>
								{errors.email && (
									<p className="mt-1 text-sm text-red-600">
										{errors.email}
									</p>
								)}
							</div>
						)}

						{/* Wallet Address - Wallet Auth */}
						{formData.authMethod === "wallet" && (
							<div className="space-y-3">
								<div>
									<label
										htmlFor="walletAddress"
										className="block text-sm font-medium text-gray-700 mb-1">
										<div className="flex items-center space-x-1">
											<Wallet className="w-4 h-4" />
											<span>Địa chỉ ví *</span>
										</div>
									</label>
									<input
										type="text"
										id="walletAddress"
										name="walletAddress"
										value={formData.walletAddress}
										onChange={handleInputChange}
										className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
											errors.walletAddress
												? "border-red-300"
												: "border-gray-300"
										}`}
										placeholder="0x..."
									/>
									{errors.walletAddress && (
										<p className="mt-1 text-sm text-red-600">
											{errors.walletAddress}
										</p>
									)}
								</div>

								<div>
									<label className="flex items-center space-x-2">
										<input
											type="checkbox"
											name="isWalletVerified"
											checked={formData.isWalletVerified}
											onChange={handleInputChange}
											className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
										/>
										<span className="text-sm text-gray-700">
											Ví đã được xác thực
										</span>
									</label>
								</div>
							</div>
						)}
					</div>

					{/* Contact Information */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
							<Phone className="w-5 h-5" />
							<span>Thông tin liên hệ</span>
						</h3>

						{/* Phone Number */}
						<div>
							<label
								htmlFor="phoneNumber"
								className="block text-sm font-medium text-gray-700 mb-1">
								Số điện thoại
							</label>
							<input
								type="tel"
								id="phoneNumber"
								name="phoneNumber"
								value={formData.phoneNumber}
								onChange={handleInputChange}
								className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
									errors.phoneNumber
										? "border-red-300"
										: "border-gray-300"
								}`}
								placeholder="Nhập số điện thoại"
							/>
							{errors.phoneNumber && (
								<p className="mt-1 text-sm text-red-600">
									{errors.phoneNumber}
								</p>
							)}
						</div>

						{/* Date of Birth */}
						<div>
							<label
								htmlFor="dateOfBirth"
								className="block text-sm font-medium text-gray-700 mb-1">
								<div className="flex items-center space-x-1">
									<Calendar className="w-4 h-4" />
									<span>Ngày sinh</span>
								</div>
							</label>
							<input
								type="date"
								id="dateOfBirth"
								name="dateOfBirth"
								value={formData.dateOfBirth}
								onChange={handleInputChange}
								className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
									errors.dateOfBirth
										? "border-red-300"
										: "border-gray-300"
								}`}
							/>
							{errors.dateOfBirth && (
								<p className="mt-1 text-sm text-red-600">
									{errors.dateOfBirth}
								</p>
							)}
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors">
							Hủy bỏ
						</button>
						<button
							type="button"
							onClick={handleSubmit}
							disabled={isLoading}
							className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2">
							<Save className="w-4 h-4" />
							<span>
								{isLoading ? "Đang lưu..." : "Lưu thay đổi"}
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EditUserModal;
