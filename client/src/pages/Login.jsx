import {
	Activity,
	Calendar,
	Eye,
	EyeOff,
	FileText,
	Lock,
	Mail,
	Phone,
	Shield,
	Stethoscope,
	User,
} from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import { apiRegister } from "../apis/user";
import { apiLogin } from "../apis/auth";
import { Navigate, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth"; // Import useAuth

const MedicalAuthSystem = () => {
	const [isLogin, setIsLogin] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	// Sử dụng Auth Context
	const { login } = useAuth();
	const navigate = useNavigate();

	// Login state
	const [loginData, setLoginData] = useState({
		email: "thinh@gmail.com",
		password: "123456",
	});

	// Register state
	const [registerData, setRegisterData] = useState({
		email: "",
		password: "",
		name: "",
		role: "patient", // Fixed role as patient
		phoneNumber: "",
		dateOfBirth: "",
	});

	const [errors, setErrors] = useState({});

	const { user } = useAuth(); // Get user from Auth Context
	if (user) {
		return <Navigate to="/" replace />;
	}

	const validateEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleLogin = async () => {
		setLoading(true);
		setErrors({});

		// Validation
		const newErrors = {};
		if (!loginData.email) newErrors.email = "Email là bắt buộc";
		else if (!validateEmail(loginData.email))
			newErrors.email = "Email không hợp lệ";
		if (!loginData.password) newErrors.password = "Mật khẩu là bắt buộc";

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			setLoading(false);
			return;
		}

		try {
			const response = await apiLogin(loginData);
			
			if(response.success) {
				// Lưu thông tin đăng nhập qua Auth Context
				const loginSuccess = login(
					response.data.user,
					response.data.accessToken,
					response.data.refreshToken
				);

				if (loginSuccess) {
					setErrors({});
					Swal.fire({
						icon: "success",
						title: "Đăng nhập thành công",
						text: "Chào mừng bạn trở lại!",
						timer: 1500,
						showConfirmButton: false,
					}).then(() => {
						// Reset login data
						setLoginData({
							email: "",
							password: "",
						});
						navigate("/");
					});
				} else {
					setErrors({ general: "Lỗi lưu thông tin đăng nhập" });
				}
			} else {
				Swal.fire({
					icon: "error",
					title: "Đăng nhập thất bại",
					text: response.message,
				});
				setErrors({ general: response.message });
			}
		} catch (error) {
			console.error("Login error:", error);
			setErrors({ general: "Lỗi kết nối server" });
		}
		setLoading(false);
	};

	const handleRegister = async () => {
		setLoading(true);
		setErrors({});

		// Validation
		const newErrors = {};
		if (!registerData.email) newErrors.email = "Email là bắt buộc";
		else if (!validateEmail(registerData.email))
			newErrors.email = "Email không hợp lệ";
		if (!registerData.password) newErrors.password = "Mật khẩu là bắt buộc";
		else if (registerData.password.length < 6)
			newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
		if (!registerData.name) newErrors.name = "Họ tên là bắt buộc";

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			setLoading(false);
			return;
		}

		try {
			const response = await apiRegister(registerData);

			if (response.success) {
				setIsLogin(true);
				setRegisterData({
					email: "",
					password: "",
					name: "",
					role: "patient",
					phoneNumber: "",
					dateOfBirth: "",
				});

				Swal.fire({
					icon: "success",
					title: "Đăng ký thành công",
					text: "Bạn có thể đăng nhập ngay bây giờ.",
				});
				setErrors({});
			} else {
				Swal.fire({
					icon: "error",
					title: "Đăng ký thất bại",
					text: response.message,
				});
				setErrors({ general: response.message });
			}
		} catch (error) {
			console.error("Register error:", error);
			setErrors({ general: "Lỗi kết nối server" });
		}
		setLoading(false);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
			{/* Background Pattern */}
			<div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

			{/* Medical Icons Background */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<Activity className="absolute top-20 left-20 w-8 h-8 text-blue-200 opacity-30" />
				<Stethoscope className="absolute top-40 right-32 w-6 h-6 text-green-200 opacity-30" />
				<FileText className="absolute bottom-32 left-40 w-7 h-7 text-cyan-200 opacity-30" />
				<Shield className="absolute bottom-20 right-20 w-8 h-8 text-red-200 opacity-30" />
			</div>

			<div className="relative w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-lg">
						<Activity className="w-8 h-8 text-white" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						MedChain
					</h1>
					<p className="text-gray-600">
						Hệ thống quản lý hồ sơ y tế blockchain
					</p>
				</div>

				{/* Auth Toggle */}
				<div className="flex bg-gray-100 rounded-xl p-1 mb-6">
					<button
						onClick={() => setIsLogin(true)}
						className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
							isLogin
								? "bg-white text-blue-600 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}>
						Đăng nhập
					</button>
					<button
						onClick={() => setIsLogin(false)}
						className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
							!isLogin
								? "bg-white text-blue-600 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}>
						Đăng ký
					</button>
				</div>

				{/* Error Message */}
				{errors.general && (
					<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
						{errors.general}
					</div>
				)}

				{/* Auth Forms */}
				<div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm border border-white/20">
					{isLogin ? (
						// Login Form
						<div className="space-y-5">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type="email"
										value={loginData.email}
										onChange={(e) =>
											setLoginData({
												...loginData,
												email: e.target.value,
											})
										}
										className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
											errors.email
												? "border-red-300"
												: "border-gray-300"
										}`}
										placeholder="Nhập email của bạn"
									/>
								</div>
								{errors.email && (
									<p className="mt-1 text-sm text-red-600">
										{errors.email}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Mật khẩu
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type={
											showPassword ? "text" : "password"
										}
										value={loginData.password}
										onChange={(e) =>
											setLoginData({
												...loginData,
												password: e.target.value,
											})
										}
										className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
											errors.password
												? "border-red-300"
												: "border-gray-300"
										}`}
										placeholder="Nhập mật khẩu"
									/>
									<button
										type="button"
										onClick={() =>
											setShowPassword(!showPassword)
										}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
										{showPassword ? (
											<EyeOff className="w-5 h-5" />
										) : (
											<Eye className="w-5 h-5" />
										)}
									</button>
								</div>
								{errors.password && (
									<p className="mt-1 text-sm text-red-600">
										{errors.password}
									</p>
								)}
							</div>

							<button
								type="button"
								onClick={handleLogin}
								disabled={loading}
								className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
								{loading ? (
									<div className="flex items-center justify-center">
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
										Đang đăng nhập...
									</div>
								) : (
									"Đăng nhập"
								)}
							</button>
						</div>
					) : (
						// Register Form
						<div className="space-y-5">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Họ và tên *
								</label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type="text"
										value={registerData.name}
										onChange={(e) =>
											setRegisterData({
												...registerData,
												name: e.target.value,
											})
										}
										className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
											errors.name
												? "border-red-300"
												: "border-gray-300"
										}`}
										placeholder="Nhập họ và tên"
									/>
								</div>
								{errors.name && (
									<p className="mt-1 text-sm text-red-600">
										{errors.name}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Email *
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type="email"
										value={registerData.email}
										onChange={(e) =>
											setRegisterData({
												...registerData,
												email: e.target.value,
											})
										}
										className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
											errors.email
												? "border-red-300"
												: "border-gray-300"
										}`}
										placeholder="Nhập email"
									/>
								</div>
								{errors.email && (
									<p className="mt-1 text-sm text-red-600">
										{errors.email}
									</p>
								)}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Mật khẩu *
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type={
											showPassword ? "text" : "password"
										}
										value={registerData.password}
										onChange={(e) =>
											setRegisterData({
												...registerData,
												password: e.target.value,
											})
										}
										className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
											errors.password
												? "border-red-300"
												: "border-gray-300"
										}`}
										placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
									/>
									<button
										type="button"
										onClick={() =>
											setShowPassword(!showPassword)
										}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
										{showPassword ? (
											<EyeOff className="w-5 h-5" />
										) : (
											<Eye className="w-5 h-5" />
										)}
									</button>
								</div>
								{errors.password && (
									<p className="mt-1 text-sm text-red-600">
										{errors.password}
									</p>
								)}
							</div>

							{/* Hidden Role Field - Always Patient */}
							<input
								type="hidden"
								name="role"
								value="patient"
							/>

							{/* Role Display - Read Only */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Vai trò
								</label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
									<div className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-medium">
										Bệnh nhân
									</div>
								</div>

								{/* Role Description */}
								<div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 bg-opacity-10">
									<div className="flex items-center text-sm">
										<User className="w-4 h-4 text-white" />
										<span className="ml-2 font-medium text-white">
											Bệnh nhân - Quản lý hồ sơ y tế cá
											nhân
										</span>
									</div>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Số điện thoại
								</label>
								<div className="relative">
									<Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type="tel"
										value={registerData.phoneNumber}
										onChange={(e) =>
											setRegisterData({
												...registerData,
												phoneNumber: e.target.value,
											})
										}
										className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
										placeholder="Nhập số điện thoại"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Ngày sinh
								</label>
								<div className="relative">
									<Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
									<input
										type="date"
										value={registerData.dateOfBirth}
										onChange={(e) =>
											setRegisterData({
												...registerData,
												dateOfBirth: e.target.value,
											})
										}
										className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
									/>
								</div>
							</div>

							<button
								type="button"
								onClick={handleRegister}
								disabled={loading}
								className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg">
								{loading ? (
									<div className="flex items-center justify-center">
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
										Đang đăng ký...
									</div>
								) : (
									"Đăng ký tài khoản"
								)}
							</button>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="text-center mt-6 text-sm text-gray-600">
					<p>Bằng cách sử dụng hệ thống, bạn đồng ý với</p>
					<p>
						<a
							href="#"
							className="text-blue-600 hover:underline">
							Điều khoản dịch vụ
						</a>
						{" và "}
						<a
							href="#"
							className="text-blue-600 hover:underline">
							Chính sách bảo mật
						</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default MedicalAuthSystem;