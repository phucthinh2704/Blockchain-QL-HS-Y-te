import React, { useState, useEffect } from "react";
import {
	Shield,
	Database,
	CheckCircle,
	XCircle,
	AlertTriangle,
	Clock,
	User,
	Calendar,
	Search,
	Filter,
	RefreshCw,
	Eye,
	Activity,
	TrendingUp,
	BarChart3,
	Link,
} from "lucide-react";
import {
	apiGetBlockchainInformation,
	apiVerifyAllBlocks,
} from "../../apis/blockchain";
import { useCallback } from "react";
import Swal from "sweetalert2";

const BlockchainTab = () => {
	const [blockchainStats, setBlockchainStats] = useState({
		totalBlocks: 0,
		validBlocks: 0,
		invalidBlocks: 0,
		integrityPercentage: 100,
		networkStatus: "healthy",
		lastVerification: null,
	});

	const [verificationHistory, setVerificationHistory] = useState([]);
	const [patientVerification, setPatientVerification] = useState({
		patientId: "",
		results: null,
		loading: false,
	});

	const [fullVerification, setFullVerification] = useState({
		results: null,
		loading: false,
	});

	const [selectedPatient, setSelectedPatient] = useState("");
	const [dateRange, setDateRange] = useState({
		startDate: "",
		endDate: "",
	});

	const [recentActivity, setRecentActivity] = useState([]);
	const [loading, setLoading] = useState(false);

	const apiVerifyBlockchain = async () => {
		setLoading(true);
		try {
			const response = await apiVerifyAllBlocks();
			return response;
		} catch (error) {
			console.error("API Error:", error);
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const apiGetBlockchainInfo = useCallback(async () => {
		try {
			const response = await apiGetBlockchainInformation();
			return response;
		} catch (error) {
			console.error("API Error:", error);
			throw error;
		}
	}, []);

	const apiVerifyPatientBlocks = async (patientId, timeRange = {}) => {
		let url = `${
			import.meta.env.VITE_API_URI
		}/blockchain/patient/${patientId}/verify`;
		if (timeRange.startDate || timeRange.endDate) {
			url += "/timerange";
			const params = new URLSearchParams();
			if (timeRange.startDate)
				params.append("startDate", timeRange.startDate);
			if (timeRange.endDate) params.append("endDate", timeRange.endDate);
			url += "?" + params.toString();
		}

		try {
			const response = await fetch(url, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${localStorage.getItem(
						"accessToken"
					)}`,
					"Content-Type": "application/json",
				},
			});
			const data = await response.json();
			return data;
		} catch (error) {
			console.error("API Error:", error);
			throw error;
		}
	};

	const apiVerifyFullBlockchain = async () => {
		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URI}/blockchain/verify/full`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${localStorage.getItem(
							"accessToken"
						)}`,
						"Content-Type": "application/json",
					},
				}
			);
			const data = await response.json();
			return data;
		} catch (error) {
			console.error("API Error:", error);
			throw error;
		}
	};

	const apiGetBlockchainStats = async () => {
		try {
			const response = await fetch(
				`${import.meta.env.VITE_API_URI}/blockchain/stats`,
				{
					method: "GET",
					headers: {
						Authorization: `Bearer ${localStorage.getItem(
							"accessToken"
						)}`,
						"Content-Type": "application/json",
					},
				}
			);
			const data = await response.json();
			return data;
		} catch (error) {
			console.error("API Error:", error);
			throw error;
		}
	};
	const loadBlockchainInfo = useCallback(async () => {
		try {
			const response = await apiGetBlockchainInfo();
			if (response.success) {
				setBlockchainStats({
					totalBlocks: response.data.totalBlocks,
					validBlocks: response.data.validBlocks,
					invalidBlocks: response.data.invalidBlocks,
					integrityPercentage: response.data.integrityPercentage,
					networkStatus: response.data.networkStatus,
					lastVerification: new Date().toLocaleString("vi-VN"),
				});
			}
		} catch (error) {
			console.error("Error loading blockchain info:", error);
		}
	}, [apiGetBlockchainInfo]);

	const loadRecentActivity = useCallback(async () => {
		try {
			const response = await apiGetBlockchainStats();
			if (response.success) {
				setRecentActivity(response.data.dailyActivity || []);
			}
		} catch (error) {
			console.error("Error loading recent activity:", error);
		}
	}, []);

	// Load initial data
	useEffect(() => {
		loadBlockchainInfo();
		loadRecentActivity();
	}, [loadBlockchainInfo, loadRecentActivity]);

	const handleVerifyBlockchain = async () => {
		setLoading(true);
		setTimeout(async () => {
			try {
				const response = await apiVerifyBlockchain();

				if (response.success) {
					// Update stats after verification
					await loadBlockchainInfo();

					// Add to verification history
					const newVerification = {
						id: Date.now(),
						timestamp: new Date().toLocaleString("vi-VN"),
						type: "Xác thực tổng quan",
						status: response.data.valid ? "success" : "error",
						message: response.data.message,
						details: response.data,
					};
					setVerificationHistory((prev) => [
						newVerification,
						...prev.slice(0, 4),
					]);

					// Show notification
					if (response.data.valid) {
						showNotification(
							"success",
							"Xác thực thành công",
							response.data.message
						);
					} else {
						showNotification(
							"warning",
							"Phát hiện vấn đề",
							response.data.message
						);
					}
				}
			} catch (error) {
				console.error("Error verifying blockchain:", error);
				showNotification(
					"error",
					"Lỗi xác thực",
					"Có lỗi xảy ra khi xác thực blockchain!"
				);
			} finally {
				setLoading(false);
			}
		}, 2000);
	};

	const handleVerifyPatient = async () => {
		if (!selectedPatient) {
			showNotification(
				"warning",
				"Thiếu thông tin",
				"Vui lòng chọn bệnh nhân cần xác thực"
			);
			return;
		}
		setPatientVerification((prev) => ({ ...prev, loading: true }));

		setTimeout(async () => {
			try {
				setPatientVerification((prev) => ({ ...prev, loading: true }));
				const response = await apiVerifyPatientBlocks(
					selectedPatient,
					dateRange
				);

				if (response.success) {
					setPatientVerification((prev) => ({
						...prev,
						results: response.data,
						loading: false,
					}));

					// Add to verification history
					const newVerification = {
						id: Date.now(),
						timestamp: new Date().toLocaleString("vi-VN"),
						type: "Xác thực bệnh nhân",
						status: response.data.overallValid
							? "success"
							: "error",
						message: response.message,
						patientId: selectedPatient,
					};
					setVerificationHistory((prev) => [
						newVerification,
						...prev.slice(0, 4),
					]);

					showNotification(
						response.data.overallValid ? "success" : "warning",
						"Xác thực hoàn tất",
						response.message
					);
				} else {
					showNotification(
						"warning",
						"Xác thực không thành công",
						response.message
					);
					setPatientVerification((prev) => ({
						...prev,
						loading: false,
					}));
				}
			} catch (error) {
				console.error("Error verifying patient:", error);
				showNotification(
					"error",
					"Lỗi xác thực",
					"Có lỗi xảy ra khi xác thực bệnh nhân!"
				);
				setPatientVerification((prev) => ({ ...prev, loading: false }));
			}
			setPatientVerification((prev) => ({ ...prev, loading: false }));
		}, 1500);
	};

	const handleFullVerification = async () => {
		setFullVerification((prev) => ({ ...prev, loading: true }));
		setTimeout(async () => {
			try {
				const response = await apiVerifyFullBlockchain();

				if (response.success) {
					setFullVerification((prev) => ({
						...prev,
						results: response.data,
						loading: false,
					}));

					// Add to verification history with safe data access
					const summary = response.data.summary || {};
					const newVerification = {
						id: Date.now(),
						timestamp: new Date().toLocaleString("vi-VN"),
						type: "Xác thực toàn bộ",
						status: response.data.valid ? "success" : "error",
						message:
							typeof response.data.message === "string"
								? response.data.message
								: "Xác thực hoàn tất",
						details:
							summary.validBlocks !== undefined &&
							summary.totalBlocks !== undefined
								? `${summary.validBlocks}/${
										summary.totalBlocks
								  } blocks hợp lệ (${
										summary.integrityPercentage || 0
								  }%)`
								: "Chi tiết không khả dụng",
					};
					setVerificationHistory((prev) => [
						newVerification,
						...prev.slice(0, 4),
					]);

					showNotification(
						response.data.valid ? "success" : "warning",
						"Xác thực toàn bộ hoàn tất",
						typeof response.data.message === "string"
							? response.data.message
							: "Quá trình xác thực đã hoàn tất"
					);
				} else {
					// Handle API error response
					setFullVerification((prev) => ({
						...prev,
						results: {
							valid: false,
							message:
								response.message ||
								"Có lỗi xảy ra trong quá trình xác thực",
							error: response.error || response,
						},
						loading: false,
					}));

					showNotification(
						"error",
						"Lỗi xác thực",
						response.message ||
							"Có lỗi xảy ra khi xác thực toàn bộ blockchain!"
					);
				}
			} catch (error) {
				console.error("Error in full verification:", error);

				// Set error state with safe structure
				setFullVerification((prev) => ({
					...prev,
					results: {
						valid: false,
						message: "Lỗi kết nối hoặc server không phản hồi",
						error: error.message || "Unknown error",
					},
					loading: false,
				}));

				showNotification(
					"error",
					"Lỗi xác thực",
					"Có lỗi xảy ra khi xác thực toàn bộ blockchain!"
				);
			}
		}, 1500);
	};

	const showNotification = (type, title, message) => {
		Swal.fire({
			icon: type,
			title: title,
			text: message,
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-semibold text-gray-900">
					Xác thực Blockchain
				</h2>
				<button
					onClick={loadBlockchainInfo}
					className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
					<RefreshCw className="w-4 h-4" />
					<span>Làm mới</span>
				</button>
			</div>

			{/* Blockchain Status Overview */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center space-x-4">
						<div
							className={`p-3 rounded-lg ${
								blockchainStats.networkStatus === "healthy"
									? "bg-green-100"
									: "bg-red-100"
							}`}>
							<Shield
								className={`w-8 h-8 ${
									blockchainStats.networkStatus === "healthy"
										? "text-green-600"
										: "text-red-600"
								}`}
							/>
						</div>
						<div>
							<h3 className="text-lg font-medium text-gray-900">
								Trạng thái Blockchain
							</h3>
							<p
								className={`text-sm ${
									blockchainStats.networkStatus === "healthy"
										? "text-green-600"
										: "text-red-600"
								}`}>
								{blockchainStats.networkStatus === "healthy"
									? "Tất cả blocks đều hợp lệ và an toàn"
									: "Phát hiện các vấn đề về tính toàn vẹn"}
							</p>
							{blockchainStats.lastVerification && (
								<p className="text-xs text-gray-500 mt-1">
									Xác thực lần cuối:{" "}
									{blockchainStats.lastVerification}
								</p>
							)}
						</div>
					</div>
					<button
						onClick={handleVerifyBlockchain}
						disabled={loading}
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer">
						{loading ? (
							<RefreshCw className="w-4 h-4 animate-spin" />
						) : (
							<Shield className="w-4 h-4" />
						)}
						<span>
							{loading ? "Đang xác thực..." : "Xác thực ngay"}
						</span>
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="text-center p-4 bg-green-50 rounded-lg">
						<div className="flex items-center justify-center mb-2">
							<CheckCircle className="w-6 h-6 text-green-600" />
						</div>
						<p className="text-2xl font-bold text-green-600">
							{blockchainStats.integrityPercentage}%
						</p>
						<p className="text-sm text-gray-600">Tính toàn vẹn</p>
					</div>

					<div className="text-center p-4 bg-blue-50 rounded-lg">
						<div className="flex items-center justify-center mb-2">
							<Database className="w-6 h-6 text-blue-600" />
						</div>
						<p className="text-2xl font-bold text-blue-600">
							{blockchainStats.totalBlocks}
						</p>
						<p className="text-sm text-gray-600">Tổng Blocks</p>
					</div>

					<div className="text-center p-4 bg-green-50 rounded-lg">
						<div className="flex items-center justify-center mb-2">
							<CheckCircle className="w-6 h-6 text-green-600" />
						</div>
						<p className="text-2xl font-bold text-green-600">
							{blockchainStats.validBlocks}
						</p>
						<p className="text-sm text-gray-600">Blocks hợp lệ</p>
					</div>

					<div className="text-center p-4 bg-red-50 rounded-lg">
						<div className="flex items-center justify-center mb-2">
							{blockchainStats.invalidBlocks > 0 ? (
								<XCircle className="w-6 h-6 text-red-600" />
							) : (
								<CheckCircle className="w-6 h-6 text-green-600" />
							)}
						</div>
						<p
							className={`text-2xl font-bold ${
								blockchainStats.invalidBlocks > 0
									? "text-red-600"
									: "text-green-600"
							}`}>
							{blockchainStats.invalidBlocks}
						</p>
						<p className="text-sm text-gray-600">Lỗi phát hiện</p>
					</div>
				</div>
			</div>

			{/* Verification Tools */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Patient Verification */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
						<User className="w-5 h-5 mr-2" />
						Xác thực theo bệnh nhân
					</h3>

					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								ID Bệnh nhân
							</label>
							<input
								type="text"
								value={selectedPatient}
								onChange={(e) =>
									setSelectedPatient(e.target.value)
								}
								placeholder="Nhập ID bệnh nhân"
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Từ ngày
								</label>
								<input
									type="date"
									value={dateRange.startDate}
									onChange={(e) =>
										setDateRange((prev) => ({
											...prev,
											startDate: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Đến ngày
								</label>
								<input
									type="date"
									value={dateRange.endDate}
									onChange={(e) =>
										setDateRange((prev) => ({
											...prev,
											endDate: e.target.value,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
								/>
							</div>
						</div>

						<button
							onClick={handleVerifyPatient}
							disabled={patientVerification.loading}
							className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer">
							{patientVerification.loading ? (
								<RefreshCw className="w-4 h-4 animate-spin" />
							) : (
								<Search className="w-4 h-4" />
							)}
							<span>
								{patientVerification.loading
									? "Đang xác thực..."
									: "Xác thực bệnh nhân"}
							</span>
						</button>
					</div>

					{/* Patient Verification Results */}
					{patientVerification.results && (
						<div className="mt-4 p-4 bg-gray-50 rounded-lg">
							<div className="flex items-center justify-between mb-3">
								<h4 className="font-medium text-gray-900">
									Kết quả xác thực
								</h4>
								<span
									className={`px-2 py-1 text-xs rounded-full ${
										patientVerification.results.overallValid
											? "bg-green-100 text-green-800"
											: "bg-red-100 text-red-800"
									}`}>
									{patientVerification.results.overallValid
										? "Hợp lệ"
										: "Có lỗi"}
								</span>
							</div>
							<div className="grid grid-cols-3 gap-3 text-sm">
								<div>
									<span className="text-gray-600">
										Tổng blocks:
									</span>
									<span className="ml-2 font-medium">
										{
											patientVerification.results
												.statistics.totalBlocks
										}
									</span>
								</div>
								<div>
									<span className="text-gray-600">
										Hợp lệ:
									</span>
									<span className="ml-2 font-medium text-green-600">
										{
											patientVerification.results
												.statistics.validBlocks
										}
									</span>
								</div>
								<div>
									<span className="text-gray-600">Lỗi:</span>
									<span className="ml-2 font-medium text-red-600">
										{
											patientVerification.results
												.statistics.invalidBlocks
										}
									</span>
								</div>
							</div>
							{patientVerification.results.errorBlocks?.length >
								0 && (
								<div className="mt-3">
									<h5 className="text-sm font-medium text-red-700 mb-2">
										Blocks có lỗi:
									</h5>
									<div className="space-y-1">
										{patientVerification.results.errorBlocks
											.slice(0, 3)
											.map((block, index) => (
												<div
													key={index}
													className="text-xs text-red-600 bg-red-50 p-2 rounded">
													Block #{block.blockIndex}:{" "}
													{block.errorMessages.join(
														", "
													)}
												</div>
											))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Full Blockchain Verification */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
						<Activity className="w-5 h-5 mr-2" />
						Xác thực toàn bộ Blockchain
					</h3>

					<div className="space-y-4">
						<p className="text-sm text-gray-600">
							Thực hiện xác thực tính toàn vẹn của toàn bộ
							blockchain, kiểm tra tất cả các blocks và liên kết
							giữa chúng.
						</p>

						<button
							onClick={handleFullVerification}
							disabled={fullVerification.loading}
							className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 cursor-pointer">
							{fullVerification.loading ? (
								<RefreshCw className="w-4 h-4 animate-spin" />
							) : (
								<Shield className="w-4 h-4" />
							)}
							<span>
								{fullVerification.loading
									? "Đang xác thực..."
									: "Xác thực toàn bộ"}
							</span>
						</button>
					</div>

					{/* Enhanced Full Verification Results */}
					{fullVerification.results && (
						<div className="mt-6 space-y-4">
							{/* Main Status Card */}
							<div className="p-4 bg-gray-50 rounded-lg border-l-4 border-l-purple-500">
								<div className="flex items-center justify-between mb-3">
									<h4 className="font-medium text-gray-900 flex items-center">
										<CheckCircle className="w-4 h-4 mr-2" />
										Kết quả xác thực toàn bộ
									</h4>
									<span
										className={`px-3 py-1 text-xs font-medium rounded-full ${
											fullVerification.results.valid
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}>
										{fullVerification.results.valid
											? "Hoàn toàn hợp lệ"
											: "Có vấn đề"}
									</span>
								</div>

								<p className="text-sm text-gray-600 mb-3">
									{typeof fullVerification.results.message ===
									"string"
										? fullVerification.results.message
										: JSON.stringify(
												fullVerification.results.message
										  )}
								</p>

								{/* Summary Statistics - Only show if summary exists */}
								{fullVerification.results.summary && (
									<div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
										<div className="bg-white p-3 rounded-lg">
											<div className="text-gray-600 text-xs mb-1">
												Tổng blocks
											</div>
											<div className="font-semibold text-lg">
												{fullVerification.results
													.summary.totalBlocks || 0}
											</div>
										</div>
										<div className="bg-white p-3 rounded-lg">
											<div className="text-gray-600 text-xs mb-1">
												Tính toàn vẹn
											</div>
											<div
												className={`font-semibold text-lg ${
													fullVerification.results
														.summary
														.integrityPercentage ===
													100
														? "text-green-600"
														: "text-red-600"
												}`}>
												{fullVerification.results
													.summary
													.integrityPercentage || 0}
												%
											</div>
										</div>
										<div className="bg-white p-3 rounded-lg">
											<div className="text-gray-600 text-xs mb-1">
												Blocks hợp lệ
											</div>
											<div className="font-semibold text-lg text-green-600">
												{fullVerification.results
													.summary.validBlocks || 0}
											</div>
										</div>
										<div className="bg-white p-3 rounded-lg">
											<div className="text-gray-600 text-xs mb-1">
												Thời gian
											</div>
											<div className="font-semibold text-lg">
												{fullVerification.results
													.verification
													?.executionTime || 0}
												ms
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Action Statistics - Only show if statistics exists */}
							{fullVerification.results.statistics &&
								fullVerification.results.statistics
									.actionBreakdown && (
									<div className="p-4 bg-blue-50 rounded-lg">
										<h5 className="font-medium text-gray-900 mb-3 flex items-center">
											<BarChart3 className="w-4 h-4 mr-2" />
											Thống kê hoạt động
										</h5>
										<div className="grid grid-cols-3 gap-3 text-sm">
											<div className="text-center">
												<div className="text-2xl font-bold text-green-600">
													{fullVerification.results
														.statistics
														.actionBreakdown
														.create || 0}
												</div>
												<div className="text-gray-600">
													Tạo mới
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-blue-600">
													{fullVerification.results
														.statistics
														.actionBreakdown
														.update || 0}
												</div>
												<div className="text-gray-600">
													Cập nhật
												</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-red-600">
													{fullVerification.results
														.statistics
														.actionBreakdown
														.delete || 0}
												</div>
												<div className="text-gray-600">
													Xóa
												</div>
											</div>
										</div>
									</div>
								)}

							{/* Chain Information - Only show if statistics exists */}
							{fullVerification.results.statistics && (
								<div className="p-4 bg-green-50 rounded-lg">
									<h5 className="font-medium text-gray-900 mb-3 flex items-center">
										<Link className="w-4 h-4 mr-2" />
										Thông tin chuỗi
									</h5>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
										{fullVerification.results.statistics
											.oldestBlock && (
											<div>
												<div className="text-gray-600 mb-1">
													Block đầu tiên:
												</div>
												<div className="bg-white p-2 rounded border">
													<div>
														Index:{" "}
														{
															fullVerification
																.results
																.statistics
																.oldestBlock
																.index
														}
													</div>
													<div>
														Action:{" "}
														{
															fullVerification
																.results
																.statistics
																.oldestBlock
																.action
														}
													</div>
													<div className="text-xs text-gray-500">
														{new Date(
															fullVerification.results.statistics.oldestBlock.timestamp
														).toLocaleString(
															"vi-VN"
														)}
													</div>
												</div>
											</div>
										)}
										{fullVerification.results.statistics
											.newestBlock && (
											<div>
												<div className="text-gray-600 mb-1">
													Block mới nhất:
												</div>
												<div className="bg-white p-2 rounded border">
													<div>
														Index:{" "}
														{
															fullVerification
																.results
																.statistics
																.newestBlock
																.index
														}
													</div>
													<div>
														Action:{" "}
														{
															fullVerification
																.results
																.statistics
																.newestBlock
																.action
														}
													</div>
													<div className="text-xs text-gray-500">
														{new Date(
															fullVerification.results.statistics.newestBlock.timestamp
														).toLocaleString(
															"vi-VN"
														)}
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Invalid Blocks Details - Only show if there are invalid blocks */}
							{fullVerification.results.summary &&
								fullVerification.results.summary.invalidBlocks >
									0 &&
								fullVerification.results.verification &&
								fullVerification.results.verification
									.details && (
									<div className="p-4 bg-red-50 rounded-lg border border-red-200">
										<h5 className="font-medium text-red-800 mb-3 flex items-center">
											<AlertTriangle className="w-4 h-4 mr-2" />
											Blocks có vấn đề (
											{
												fullVerification.results.summary
													.invalidBlocks
											}
											)
										</h5>
										<div className="space-y-2 max-h-40 overflow-y-auto">
											{fullVerification.results.verification.details
												.filter(
													(detail) => !detail.isValid
												)
												.map((detail, index) => (
													<div
														key={index}
														className="bg-white p-3 rounded border border-red-200">
														<div className="flex justify-between items-start mb-2">
															<span className="font-medium text-red-800">
																Block #
																{
																	detail.blockIndex
																}
															</span>
															<span className="text-xs text-red-600">
																{detail.action}
															</span>
														</div>
														<div className="text-sm text-red-700">
															<div className="font-medium mb-1">
																Vấn đề:
															</div>
															<ul className="list-disc list-inside space-y-1">
																{Array.isArray(
																	detail.issues
																) ? (
																	detail.issues.map(
																		(
																			issue,
																			i
																		) => (
																			<li
																				key={
																					i
																				}
																				className="text-xs">
																				{typeof issue ===
																				"string"
																					? issue
																					: JSON.stringify(
																							issue
																					  )}
																			</li>
																		)
																	)
																) : (
																	<li className="text-xs">
																		{typeof detail.issues ===
																		"string"
																			? detail.issues
																			: "Unknown issue"}
																	</li>
																)}
															</ul>
														</div>
														<div className="text-xs text-gray-500 mt-2">
															Hash:{" "}
															{detail.hash ||
																"N/A"}{" "}
															|
															{detail.updatedBy &&
																` Cập nhật bởi: ${detail.updatedBy} |`}
															{detail.timestamp &&
																new Date(
																	detail.timestamp
																).toLocaleString(
																	"vi-VN"
																)}
														</div>
													</div>
												))}
										</div>
									</div>
								)}

							{/* Genesis Block Status - Only show if genesis block is invalid */}
							{fullVerification.results.summary &&
								!fullVerification.results.summary
									.genesisBlockValid && (
									<div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
										<div className="flex items-center">
											<AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
											<span className="font-medium text-orange-800">
												Genesis Block không hợp lệ
											</span>
										</div>
										<p className="text-sm text-orange-700 mt-1">
											Block đầu tiên của blockchain có vấn
											đề về previous hash.
										</p>
									</div>
								)}

							{/* Verification Metadata - Only show if verification data exists */}
							{fullVerification.results.verification && (
								<div className="text-xs text-gray-500 border-t pt-3">
									<div className="flex justify-between">
										<span>
											Xác thực lúc:{" "}
											{fullVerification.results
												.verification
												.verificationTimestamp
												? new Date(
														fullVerification.results.verification.verificationTimestamp
												  ).toLocaleString("vi-VN")
												: new Date().toLocaleString(
														"vi-VN"
												  )}
										</span>
										<span>
											Chain length:{" "}
											{fullVerification.results
												.verification.chainLength || 0}
										</span>
									</div>
								</div>
							)}

							{/* Error Display - Show if there's an error but no proper structure */}
							{!fullVerification.results.summary &&
								!fullVerification.results.statistics && (
									<div className="p-4 bg-red-50 rounded-lg border border-red-200">
										<div className="flex items-center mb-2">
											<AlertTriangle className="w-4 h-4 text-red-600 mr-2" />
											<span className="font-medium text-red-800">
												Lỗi xác thực
											</span>
										</div>
										<div className="text-sm text-red-700">
											<pre className="whitespace-pre-wrap break-words">
												{JSON.stringify(
													fullVerification.results,
													null,
													2
												)}
											</pre>
										</div>
									</div>
								)}
						</div>
					)}
				</div>
			</div>

			{/* Verification History */}
			{verificationHistory.length > 0 && (
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
						<Clock className="w-5 h-5 mr-2" />
						Lịch sử xác thực gần đây
					</h3>

					<div className="space-y-3">
						{verificationHistory.map((item) => (
							<div
								key={item.id}
								className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
								<div className="flex items-center space-x-3">
									<div
										className={`w-2 h-2 rounded-full ${
											item.status === "success"
												? "bg-green-500"
												: item.status === "warning"
												? "bg-yellow-500"
												: "bg-red-500"
										}`}></div>
									<div>
										<div className="text-sm font-medium text-gray-900">
											{item.type}
										</div>
										<div className="text-xs text-gray-600">
											{item.message}
										</div>
										{item.patientId && (
											<div className="text-xs text-gray-500">
												Bệnh nhân: {item.patientId}
											</div>
										)}
									</div>
								</div>
								<div className="text-xs text-gray-500">
									{item.timestamp}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Blockchain Features */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						Tính năng Blockchain
					</h3>
					<div className="space-y-3">
						<div className="flex items-center space-x-3">
							<CheckCircle className="w-5 h-5 text-green-600" />
							<span className="text-gray-700">
								Bảo mật dữ liệu y tế
							</span>
						</div>
						<div className="flex items-center space-x-3">
							<CheckCircle className="w-5 h-5 text-green-600" />
							<span className="text-gray-700">
								Không thể chỉnh sửa hồ sơ cũ
							</span>
						</div>
						<div className="flex items-center space-x-3">
							<CheckCircle className="w-5 h-5 text-green-600" />
							<span className="text-gray-700">
								Theo dõi lịch sử thay đổi
							</span>
						</div>
						<div className="flex items-center space-x-3">
							<CheckCircle className="w-5 h-5 text-green-600" />
							<span className="text-gray-700">
								Xác thực tính toàn vẹn
							</span>
						</div>
					</div>
				</div>

				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
					<h3 className="text-lg font-medium text-gray-900 mb-4">
						Thống kê gần đây
					</h3>
					<div className="space-y-3">
						<div className="flex justify-between">
							<span className="text-gray-600">
								Hồ sơ được tạo hôm nay:
							</span>
							<span className="font-medium">2</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">
								Blocks được thêm tuần này:
							</span>
							<span className="font-medium">8</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">
								Lần xác thực cuối:
							</span>
							<span className="font-medium">
								{blockchainStats.lastVerification ||
									"5 phút trước"}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-gray-600">
								Trạng thái mạng:
							</span>
							<span
								className={`font-medium ${
									blockchainStats.networkStatus === "healthy"
										? "text-green-600"
										: "text-red-600"
								}`}>
								{blockchainStats.networkStatus === "healthy"
									? "Khỏe mạnh"
									: "Có vấn đề"}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BlockchainTab;
