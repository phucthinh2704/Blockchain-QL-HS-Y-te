import {
	Activity,
	AlertCircle,
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
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
	apiGetWalletLoginMessage,
	apiGetWalletRegistrationMessage,
	apiLogin,
	apiRegister,
	apiWalletLogin,
	apiWalletRegister,
	signMessageWithWallet,
} from "../apis/auth";
import useAuth from "../hooks/useAuth";

const MedicalAuthSystem = () => {
	const [isLogin, setIsLogin] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [walletConnected, setWalletConnected] = useState(false);
	const [walletAddress, setWalletAddress] = useState("");
	const [authMethod, setAuthMethod] = useState("traditional");

	const { login, user } = useAuth();
	const navigate = useNavigate();

	// Login state
	const [loginData, setLoginData] = useState({
		email: "bacsi@gmail.com",
		password: "123456",
	});

	// Register state
	const [registerData, setRegisterData] = useState({
		email: "",
		password: "",
		name: "",
		role: "patient",
		phoneNumber: "",
		dateOfBirth: "",
		walletAddress: "",
	});

	const [errors, setErrors] = useState({});

	const checkWalletConnection = async () => {
		if (typeof window.ethereum !== "undefined") {
			try {
				const accounts = await window.ethereum.request({
					method: "eth_accounts",
				});
				if (accounts.length > 0) {
					setWalletConnected(true);
					setWalletAddress(accounts[0]);
				}
			} catch (error) {
				console.error("Error checking wallet connection:", error);
			}
		}
	};
	useEffect(() => {
		document.title = "Đăng nhập/Đăng ký - MedChain";
		checkWalletConnection();
	}, []);

	if(user?.role === "patient") {
		return <Navigate to="/" replace />;
	}
	else if(user?.role === "doctor") {
		return <Navigate to="/doctors" replace />;
	}
	else if(user?.role === "admin") {
		return <Navigate to="/admin" replace />;
	}
	

	const validateEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const connectWallet = async () => {
		if (typeof window.ethereum === "undefined") {
			Swal.fire({
				icon: "error",
				title: "Lỗi",
				text: "Vui lòng cài đặt MetaMask để kết nối ví.",
			});
			return;
		}

		try {
			setLoading(true);
			const accounts = await window.ethereum.request({
				method: "eth_requestAccounts",
			});

			if (accounts.length > 0) {
				setWalletConnected(true);
				setWalletAddress(accounts[0]);

				if (!isLogin) {
					setRegisterData({
						...registerData,
						walletAddress: accounts[0],
					});
				}

				showMessage(
					"success",
					"Kết nối ví thành công!",
					`Địa chỉ: ${accounts[0].slice(0, 6)}...${accounts[0].slice(
						-4
					)}`
				);
			}
		} catch (error) {
			console.error("Error connecting wallet:", error);
			showMessage(
				"error",
				"Lỗi kết nối ví",
				"Không thể kết nối với MetaMask"
			);
		} finally {
			setLoading(false);
		}
	};

	const disconnectWallet = () => {
		setWalletConnected(false);
		setWalletAddress("");
		if (!isLogin) {
			setRegisterData({
				...registerData,
				walletAddress: "",
			});
		}
	};

	const showMessage = (type, title, text) => {
		Swal.fire({
			icon: type === "success" ? "success" : "error",
			title: title,
			text: text,
		});
	};

	const handleLogin = async () => {
		setLoading(true);
		setErrors({});

		try {
			if (authMethod === "wallet") {
				// Wallet login process
				if (!walletConnected) {
					showMessage("error", "Lỗi", "Vui lòng kết nối ví trước");
					setLoading(false);
					return;
				}

				// Step 1: Get message to sign
				const messageResponse = await apiGetWalletLoginMessage(
					walletAddress
				);
				const { message } = messageResponse.data;

				// Step 2: Sign message with wallet
				const { signature } = await signMessageWithWallet(message);

				// Step 3: Login with signature
				const loginResponse = await apiWalletLogin({
					walletAddress,
					signature,
					message,
				});

				if (loginResponse.success) {
					showMessage(
						"success",
						"Đăng nhập thành công",
						"Chào mừng bạn trở lại!"
					);
					// Store user data and token if needed
					login(
						loginResponse.data.user,
						loginResponse.data.accessToken,
						loginResponse.data.refreshToken
					);
					setLoginData({ email: "", password: "" });
					navigate(
						`${
							loginResponse.data.user.role === "admin"
								? "/admin"
								: loginResponse.data.user.role === "doctor"
								? "/doctors"
								: "/"
						}`
					);
				}
			} else {
				// Traditional login
				const newErrors = {};
				if (!loginData.email) newErrors.email = "Email là bắt buộc";
				else if (!validateEmail(loginData.email))
					newErrors.email = "Email không hợp lệ";
				if (!loginData.password)
					newErrors.password = "Mật khẩu là bắt buộc";

				if (Object.keys(newErrors).length > 0) {
					setErrors(newErrors);
					setLoading(false);
					return;
				}

				const response = await apiLogin({
					email: loginData.email,
					password: loginData.password,
				});

				if (response.success) {
					login(
						response.data.user,
						response.data.accessToken,
						response.data.refreshToken
					);
					showMessage(
						"success",
						"Đăng nhập thành công",
						"Chào mừng bạn trở lại!"
					);
					setLoginData({ email: "", password: "" });
					navigate(
						`${
							response.data.user.role === "admin"
								? "/admin"
								: response.data.user.role === "doctor"
								? "/doctors"
								: "/"
						}`
					);
				}
				else {
					setErrors({ general: "Email hoặc mật khẩu không đúng" });
					setLoading(false);
					Swal.fire({
						icon: "error",
						title: "Đăng nhập thất bại",
						text: "Email hoặc mật khẩu không đúng",
					});
				}
			}
		} catch (error) {
			console.error("Login error:", error);

			// Handle different types of errors
			if (error.response?.status === 401) {
				if (authMethod === "wallet") {
					setErrors({
						general:
							"Ví chưa được đăng ký hoặc chữ ký không hợp lệ",
					});
				} else {
					setErrors({ general: "Email hoặc mật khẩu không đúng" });
				}
			} else if (error.response?.status === 400) {
				setErrors({
					general: error.response.message || "Dữ liệu không hợp lệ",
				});
			} else if (error.message.includes("MetaMask")) {
				setErrors({ general: "Lỗi MetaMask: " + error.message });
			} else {
				setErrors({ general: "Lỗi kết nối server. Vui lòng thử lại." });
			}
		} finally {
			setLoading(false);
		}
	};

	const handleRegister = async () => {
		setLoading(true);
		setErrors({});

		try {
			// Validation
			const newErrors = {};
			if (!registerData.name) newErrors.name = "Họ tên là bắt buộc";
			if (!registerData.phoneNumber)
				newErrors.phoneNumber = "Số diện thoại là bắt buộc";
			if (!registerData.dateOfBirth)
				newErrors.dateOfBirth = "Ngày sinh là bắt buộc";
			if (registerData.dateOfBirth && registerData.dateOfBirth > new Date()) {
				newErrors.dateOfBirth = "Ngày sinh không hợp lệ";
			}

			if (authMethod === "traditional") {
				if (!registerData.email) newErrors.email = "Email là bắt buộc";
				else if (!validateEmail(registerData.email))
					newErrors.email = "Email không hợp lệ";
				if (!registerData.password)
					newErrors.password = "Mật khẩu là bắt buộc";
				else if (registerData.password.length < 6)
					newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
			} else {
				if (!walletConnected || !registerData.walletAddress) {
					newErrors.wallet = "Vui lòng kết nối ví";
				}
			}

			if (Object.keys(newErrors).length > 0) {
				setErrors(newErrors);
				setLoading(false);
				return;
			}

			if (authMethod === "wallet") {
				// Wallet registration process
				// Step 1: Get current wallet address from MetaMask
				const accounts = await window.ethereum.request({
					method: "eth_accounts",
				});
				if (accounts.length === 0) {
					setErrors({ wallet: "Không có ví nào được kết nối" });
					setLoading(false);
					return;
				}

				const currentWalletAddress = accounts[0].toLowerCase();

				// Make sure registerData has the correct wallet address
				if (
					registerData.walletAddress.toLowerCase() !==
					currentWalletAddress
				) {
					setRegisterData((prev) => ({
						...prev,
						walletAddress: currentWalletAddress,
					}));
				}

				// Step 2: Get message to sign for registration
				const messageResponse = await apiGetWalletRegistrationMessage(
					currentWalletAddress
				);
				const { message } = messageResponse.data;

				// Step 3: Sign message with wallet
				const { signature, walletAddress: signedWalletAddress } =
					await signMessageWithWallet(message);

				// Double check addresses match
				if (
					signedWalletAddress.toLowerCase() !== currentWalletAddress
				) {
					setErrors({ wallet: "Địa chỉ ví không khớp" });
					setLoading(false);
					return;
				}

				// Step 4: Register with signature
				const registerResponse = await apiWalletRegister({
					name: registerData.name,
					phoneNumber: registerData.phoneNumber,
					dateOfBirth: registerData.dateOfBirth,
					walletAddress: currentWalletAddress,
					signature,
					message,
					role: registerData.role,
				});

				if (registerResponse.success) {
					setIsLogin(true);
					setRegisterData({
						email: "",
						password: "",
						name: "",
						role: "patient",
						phoneNumber: "",
						dateOfBirth: "",
						walletAddress: "",
					});
					showMessage(
						"success",
						"Đăng ký thành công",
						"Bạn có thể đăng nhập ngay bây giờ."
					);
					setErrors({});
				}
				else {
					setErrors({ general: "Đăng ký thất bại" });
					Swal.fire({
						icon: "error",
						title: "Lỗi",
						text: "Địa chỉ ví đã được sử dụng hoặc có lỗi trong quá trình đăng ký. Vui lòng thử lại.",
					});
				}
			} else {
				// Traditional registration (unchanged)
				const response = await apiRegister({
					name: registerData.name,
					email: registerData.email,
					password: registerData.password,
					phoneNumber: registerData.phoneNumber,
					dateOfBirth: registerData.dateOfBirth,
					role: registerData.role,
				});

				if (response.success) {
					setIsLogin(true);
					setRegisterData({
						email: "",
						password: "",
						name: "",
						role: "patient",
						phoneNumber: "",
						dateOfBirth: "",
						walletAddress: "",
					});
					showMessage(
						"success",
						"Đăng ký thành công",
						"Bạn có thể đăng nhập ngay bây giờ."
					);
					setErrors({});
				}
			}
		} catch (error) {
			console.error("Register error:", error);

			// Handle different types of errors
			if (error.response?.status === 400) {
				const errorMessage =
					error.response.data?.message || error.response.message;
				if (errorMessage.includes("email")) {
					setErrors({ email: "Email đã được sử dụng" });
				} else if (
					errorMessage.includes("wallet") ||
					errorMessage.includes("signature")
				) {
					setErrors({ wallet: errorMessage });
				} else {
					setErrors({
						general: errorMessage || "Dữ liệu không hợp lệ",
					});
				}
			} else if (error.message.includes("MetaMask")) {
				setErrors({ general: "Lỗi MetaMask: " + error.message });
			} else {
				setErrors({ general: "Lỗi kết nối server. Vui lòng thử lại." });
			}
		} finally {
			setLoading(false);
		}
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
				<Wallet className="absolute top-60 left-60 w-6 h-6 text-purple-200 opacity-30" />
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
						className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer ${
							isLogin
								? "bg-white text-blue-600 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}>
						Đăng nhập
					</button>
					<button
						onClick={() => setIsLogin(false)}
						className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer ${
							!isLogin
								? "bg-white text-blue-600 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}>
						Đăng ký
					</button>
				</div>

				{/* Authentication Method Toggle */}
				<div className="flex bg-gray-100 rounded-xl p-1 mb-6">
					<button
						onClick={() => setAuthMethod("traditional")}
						className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer ${
							authMethod === "traditional"
								? "bg-white text-blue-600 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}>
						<div className="flex items-center justify-center">
							<Mail className="w-4 h-4 mr-1" />
							Truyền thống
						</div>
					</button>
					<button
						onClick={() => setAuthMethod("wallet")}
						className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer ${
							authMethod === "wallet"
								? "bg-white text-purple-600 shadow-sm"
								: "text-gray-600 hover:text-gray-900"
						}`}>
						<div className="flex items-center justify-center">
							<Wallet className="w-4 h-4 mr-1" />
							Ví Crypto
						</div>
					</button>
				</div>

				{/* Wallet Connection Status */}
				{authMethod === "wallet" && (
					<div className="mb-6">
						<div
							className={`p-4 rounded-lg border ${
								walletConnected
									? "bg-green-50 border-green-200"
									: "bg-yellow-50 border-yellow-200"
							}`}>
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<Wallet
										className={`w-5 h-5 mr-2 ${
											walletConnected
												? "text-green-600"
												: "text-yellow-600"
										}`}
									/>
									<span
										className={`text-sm font-medium ${
											walletConnected
												? "text-green-700"
												: "text-yellow-700"
										}`}>
										{walletConnected
											? "Ví đã kết nối"
											: "Chưa kết nối ví"}
									</span>
								</div>
								{walletConnected ? (
									<button
										onClick={disconnectWallet}
										className="text-xs text-red-600 hover:text-red-800">
										Ngắt kết nối
									</button>
								) : (
									<button
										onClick={connectWallet}
										disabled={loading}
										className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50">
										Kết nối
									</button>
								)}
							</div>
							{walletConnected && (
								<div className="mt-2 text-xs text-gray-600 font-mono">
									{walletAddress.slice(0, 6)}...
									{walletAddress.slice(-4)}
								</div>
							)}
						</div>
					</div>
				)}

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
							{authMethod === "traditional" ? (
								// Traditional Login
								<div
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleLogin();
										}
									}}>
									<div className="mb-5">
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

									<div className="mb-5">
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Mật khẩu
										</label>
										<div className="relative">
											<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
											<input
												type={
													showPassword
														? "text"
														: "password"
												}
												value={loginData.password}
												onChange={(e) =>
													setLoginData({
														...loginData,
														password:
															e.target.value,
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
													setShowPassword(
														!showPassword
													)
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
								</div>
							) : (
								// Wallet Login
								<div className="space-y-5">
									{!walletConnected ? (
										<div className="text-center py-8">
											<Wallet className="w-16 h-16 text-purple-400 mx-auto mb-4" />
											<h3 className="text-lg font-medium text-gray-900 mb-2">
												Đăng nhập bằng Ví Crypto
											</h3>
											<p className="text-gray-600 mb-4">
												Kết nối ví MetaMask để đăng nhập
												an toàn
											</p>
											<button
												onClick={connectWallet}
												disabled={loading}
												className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg">
												{loading
													? "Đang kết nối..."
													: "Kết nối MetaMask"}
											</button>
										</div>
									) : (
										<div className="text-center py-8">
											<div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
												<Wallet className="w-8 h-8 text-white" />
											</div>
											<h3 className="text-lg font-medium text-gray-900 mb-2">
												Ví đã kết nối
											</h3>
											<p className="text-gray-600 mb-1">
												{walletAddress.slice(0, 6)}...
												{walletAddress.slice(-4)}
											</p>
											<p className="text-sm text-gray-500 mb-4">
												Nhấn đăng nhập để tiếp tục
											</p>
										</div>
									)}
								</div>
							)}

							<button
								type="button"
								onClick={handleLogin}
								disabled={
									loading ||
									(authMethod === "wallet" &&
										!walletConnected)
								}
								className={`w-full py-3 px-4 rounded-lg font-medium focus:ring-2 focus:ring-offset-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
									authMethod === "wallet"
										? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500"
										: "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 focus:ring-blue-500"
								}`}>
								{loading ? (
									<div className="flex items-center justify-center">
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
										Đang đăng nhập...
									</div>
								) : (
									`Đăng nhập ${
										authMethod === "wallet" ? "bằng Ví" : ""
									}`
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

							{authMethod === "traditional" ? (
								// Traditional Register Fields
								<>
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
													showPassword
														? "text"
														: "password"
												}
												value={registerData.password}
												onChange={(e) =>
													setRegisterData({
														...registerData,
														password:
															e.target.value,
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
													setShowPassword(
														!showPassword
													)
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
								</>
							) : (
								// Wallet Register Fields
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Địa chỉ ví *
									</label>
									<div className="relative">
										<Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" />
										<input
											type="text"
											value={registerData.walletAddress}
											readOnly
											className={`w-full pl-10 pr-4 py-3 border rounded-lg bg-gray-50 text-gray-700 font-mono text-sm ${
												errors.wallet
													? "border-red-300"
													: "border-gray-300"
											}`}
											placeholder="Kết nối ví để tự động điền"
										/>
										{!walletConnected && (
											<button
												onClick={connectWallet}
												disabled={loading}
												className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 disabled:opacity-50">
												Kết nối
											</button>
										)}
									</div>
									{errors.wallet && (
										<p className="mt-1 text-sm text-red-600">
											{errors.wallet}
										</p>
									)}
									{walletConnected && (
										<p className="mt-1 text-xs text-green-600">
											✓ Ví đã được kết nối thành công
										</p>
									)}
								</div>
							)}

							{/* Role Display - Always Patient */}
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
								<div className="mt-2 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
									<div className="flex items-center text-sm">
										<User className="w-4 h-4 text-green-600" />
										<span className="ml-2 font-medium text-green-700">
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
								{errors.phoneNumber && (
									<p className="mt-1 text-sm text-red-600">
										{errors.phoneNumber}
									</p>
								)}
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
								{errors.dateOfBirth && (
									<p className="mt-1 text-sm text-red-600">
										{errors.dateOfBirth}
									</p>
								)}
							</div>

							<button
								type="button"
								onClick={handleRegister}
								disabled={loading}
								className={`w-full py-3 px-4 rounded-lg font-medium focus:ring-2 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${
									authMethod === "wallet"
										? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 focus:ring-purple-500"
										: "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 focus:ring-green-500"
								}`}>
								{loading ? (
									<div className="flex items-center justify-center">
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
										Đang đăng ký...
									</div>
								) : (
									`Đăng ký ${
										authMethod === "wallet"
											? "bằng Ví"
											: "tài khoản"
									}`
								)}
							</button>
						</div>
					)}
				</div>

				{/* Wallet Info */}
				{authMethod === "wallet" && (
					<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="flex items-start">
							<AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
							<div className="text-sm text-blue-800">
								<p className="font-medium mb-1">
									Đăng nhập bằng Ví Crypto
								</p>
								<p>
									Sử dụng MetaMask để xác thực an toàn. Địa
									chỉ ví sẽ được liên kết với tài khoản của
									bạn.
								</p>
							</div>
						</div>
					</div>
				)}

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
