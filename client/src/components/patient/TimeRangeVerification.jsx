import React, { useState } from "react";
import {
	Calendar,
	Check,
	Clock,
	Loader2,
	X,
	AlertTriangle,
	AlertCircle,
} from "lucide-react";
import { apiVerifyPatientBlocksTimeRange } from "../../apis/blockchain";
import useAuth from "../../hooks/useAuth";
import Swal from "sweetalert2";
import { formatDateTime } from "../../utils/dateUtils";

const TimeRangeVerification = () => {
	const { user } = useAuth();

	// States for verification data
	const [timeRangeVerification, setTimeRangeVerification] = useState(null);
	const [verifyingTimeRange, setVerifyingTimeRange] = useState(false);

	// Time range filter
	const [timeRangeFilter, setTimeRangeFilter] = useState({
		startDate: "",
		endDate: "",
	});

	const getActionText = (action) => {
		const actionMap = {
			create: "Tạo mới",
			update: "Cập nhật",
			delete: "Xóa",
			view: "Xem",
		};
		return actionMap[action] || action;
	};

	const showAlert = (type, title, text) => {
		Swal.fire({
			icon: type,
			title: title,
			text: text,
		});
	};

	const handleVerifyTimeRange = async () => {
		if (!user?._id) return;

		// Kiểm tra ít nhất một trong hai ngày được chọn
		if (!timeRangeFilter.startDate && !timeRangeFilter.endDate) {
			showAlert(
				"warning",
				"Chưa chọn khoảng thời gian",
				"Vui lòng chọn ít nhất một ngày bắt đầu hoặc kết thúc."
			);
			return;
		}

		// Kiểm tra logic ngày
		if (timeRangeFilter.startDate || timeRangeFilter.endDate) {
			const today = new Date();
			today.setHours(23, 59, 59, 999);

			const { startDate, endDate } = timeRangeFilter;

			if (startDate) {
				const start = new Date(startDate);
				if (start > today) {
					showAlert(
						"warning",
						"Ngày bắt đầu không hợp lệ",
						"Ngày bắt đầu không thể nằm trong tương lai."
					);
					return;
				}
			}

			if (endDate) {
				const end = new Date(endDate);
				if (end > today) {
					showAlert(
						"warning",
						"Ngày kết thúc không hợp lệ",
						"Ngày kết thúc không thể nằm trong tương lai."
					);
					return;
				}
			}

			if (
				startDate &&
				endDate &&
				new Date(startDate) > new Date(endDate)
			) {
				showAlert(
					"warning",
					"Khoảng thời gian không hợp lệ",
					"Ngày bắt đầu không thể sau ngày kết thúc."
				);
				return;
			}
		}

		setVerifyingTimeRange(true);
		setTimeRangeVerification(null);

		try {
			const response = await apiVerifyPatientBlocksTimeRange(
				user._id,
				timeRangeFilter.startDate,
				timeRangeFilter.endDate
			);

			if (!response.success) {
				showAlert(
					"error",
					"Lỗi",
					response.message || "Không thể xác thực khoảng thời gian"
				);
				return;
			}

			setTimeRangeVerification(response.data);
			console.log(response.data);

			showAlert(
				"success",
				"Xác thực khoảng thời gian",
				`Đã xác thực ${response.data.statistics.validBlocks} blocks hợp lệ trong tổng số ${response.data.statistics.totalBlocks} blocks.`
			);
		} catch (error) {
			console.error("Error verifying time range:", error);
			showAlert("error", "Lỗi", "Có lỗi xảy ra khi xác thực");
		} finally {
			setVerifyingTimeRange(false);
		}
	};

	const handleClearTimeRange = () => {
		setTimeRangeFilter({ startDate: "", endDate: "" });
		setTimeRangeVerification(null);
	};

	return (
		<div className="p-6 max-w-7xl mx-auto">
			<div className="mb-4">
				<h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
					<Calendar
						className="text-purple-600"
						size={32}
					/>
					<span>Kiểm tra Blockchain theo Khoảng Thời gian</span>
				</h2>
				<p className="text-gray-600">
					Xác thực tính bảo mật và toàn vẹn của hồ sơ y tế trong
					khoảng thời gian cụ thể
				</p>
			</div>

			{/* Time Range Verification Section */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
				<div className="bg-gray-50 rounded-lg p-6 mb-6">
					<div className="grid md:grid-cols-4 gap-4 items-end">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Từ ngày
							</label>
							<input
								type="date"
								value={timeRangeFilter.startDate}
								onChange={(e) =>
									setTimeRangeFilter((prev) => ({
										...prev,
										startDate: e.target.value,
									}))
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Đến ngày
							</label>
							<input
								type="date"
								value={timeRangeFilter.endDate}
								onChange={(e) =>
									setTimeRangeFilter((prev) => ({
										...prev,
										endDate: e.target.value,
									}))
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
							/>
						</div>
						<div>
							<button
								onClick={handleVerifyTimeRange}
								disabled={verifyingTimeRange}
								className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
								{verifyingTimeRange ? (
									<Loader2
										className="animate-spin"
										size={16}
									/>
								) : (
									<Calendar size={16} />
								)}
								<span>
									{verifyingTimeRange
										? "Đang kiểm tra..."
										: "Xác thực"}
								</span>
							</button>
						</div>
						<div>
							<button
								onClick={handleClearTimeRange}
								disabled={verifyingTimeRange}
								className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
								<X size={16} />
								<span>Xóa bộ lọc</span>
							</button>
						</div>
					</div>
				</div>

				{/* Time Range Verification Results */}
				{timeRangeVerification && (
					<div
						className={`rounded-xl p-6 border-2 ${
							timeRangeVerification.overallValid
								? "bg-green-50 border-green-200"
								: "bg-red-50 border-red-200"
						}`}>
						<div className="flex items-center space-x-3 mb-6">
							{timeRangeVerification.overallValid ? (
								<Check
									className="text-green-600"
									size={24}
								/>
							) : (
								<AlertTriangle
									className="text-red-600"
									size={24}
								/>
							)}
							<h3
								className={`text-xl font-semibold ${
									timeRangeVerification.overallValid
										? "text-green-900"
										: "text-red-900"
								}`}>
								Kết quả xác thực{" "}
								{timeRangeVerification.timeRange?.displayText}
							</h3>
						</div>

						{/* Statistics Grid */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							<div className="bg-white rounded-lg p-4 border text-center">
								<div className="text-3xl font-bold text-gray-900">
									{
										timeRangeVerification.statistics
											.totalBlocks
									}
								</div>
								<div className="text-sm text-gray-600 mt-1">
									Blocks trong khoảng
								</div>
							</div>
							<div className="bg-white rounded-lg p-4 border text-center">
								<div className="text-3xl font-bold text-green-600">
									{
										timeRangeVerification.statistics
											.validBlocks
									}
								</div>
								<div className="text-sm text-gray-600 mt-1">
									Blocks hợp lệ
								</div>
							</div>
							<div className="bg-white rounded-lg p-4 border text-center">
								<div className="text-3xl font-bold text-red-600">
									{
										timeRangeVerification.statistics
											.invalidBlocks
									}
								</div>
								<div className="text-sm text-gray-600 mt-1">
									Blocks lỗi
								</div>
							</div>
							<div className="bg-white rounded-lg p-4 border text-center">
								<div className="text-3xl font-bold text-blue-600">
									{
										timeRangeVerification.statistics
											.validityPercentage
									}
									%
								</div>
								<div className="text-sm text-gray-600 mt-1">
									Độ tin cậy
								</div>
							</div>
						</div>

						{/* Error Blocks Summary */}
						{timeRangeVerification.errorBlocks &&
							timeRangeVerification.errorBlocks.length > 0 && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
									<h4 className="font-medium text-red-800 mb-3 flex items-center">
										<AlertCircle className="w-5 h-5 mr-2" />
										Danh sách blocks có lỗi (
										{
											timeRangeVerification.errorBlocks
												.length
										}
										)
									</h4>

									{/* Error Statistics */}
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
										<div className="bg-red-100 p-3 rounded">
											<div className="text-red-800 font-medium">
												Lỗi nghiêm trọng
											</div>
											<div className="text-red-700 text-xl font-bold">
												{
													timeRangeVerification
														.summary.errorSummary
														.highSeverityErrors
												}
											</div>
											<div className="text-red-600 text-sm">
												Hash bị thay đổi
											</div>
										</div>
										<div className="bg-yellow-100 p-3 rounded">
											<div className="text-yellow-800 font-medium">
												Lỗi trung bình
											</div>
											<div className="text-yellow-700 text-xl font-bold">
												{
													timeRangeVerification
														.summary.errorSummary
														.mediumSeverityErrors
												}
											</div>
											<div className="text-yellow-600 text-sm">
												Blockchain đứt gãy
											</div>
										</div>
										<div className="bg-orange-100 p-3 rounded">
											<div className="text-orange-800 font-medium">
												Lỗi nhẹ
											</div>
											<div className="text-orange-700 text-xl font-bold">
												{
													timeRangeVerification
														.summary.errorSummary
														.lowSeverityErrors
												}
											</div>
											<div className="text-orange-600 text-sm">
												Thiếu dữ liệu
											</div>
										</div>
									</div>

									{/* Error Blocks List */}
									<div className="space-y-3">
										{timeRangeVerification.errorBlocks.map(
											(errorBlock, index) => (
												<div
													key={index}
													className={`border rounded-lg p-3 ${
														errorBlock.severity ===
														"HIGH"
															? "border-red-300 bg-red-50"
															: errorBlock.severity ===
															  "MEDIUM"
															? "border-yellow-300 bg-yellow-50"
															: "border-orange-300 bg-orange-50"
													}`}>
													<div className="flex items-start justify-between">
														<div className="flex-1">
															<div className="flex items-center gap-2 mb-2">
																<span
																	className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
																		errorBlock.severity ===
																		"HIGH"
																			? "bg-red-100 text-red-800"
																			: errorBlock.severity ===
																			  "MEDIUM"
																			? "bg-yellow-100 text-yellow-800"
																			: "bg-orange-100 text-orange-800"
																	}`}>
																	Block #
																	{
																		errorBlock.blockIndex
																	}
																</span>
																<span className="text-sm text-gray-600">
																	{getActionText(
																		errorBlock.action
																	)}
																</span>
																<span className="text-sm text-gray-500">
																	{formatDateTime(
																		errorBlock.timestamp
																	)}
																</span>
															</div>

															<div className="text-sm font-medium text-gray-900 mb-1">
																{
																	errorBlock.diagnosis
																}
															</div>

															{/* Error Messages */}
															<div className="space-y-1">
																{errorBlock.errorMessages.map(
																	(
																		message,
																		msgIndex
																	) => (
																		<div
																			key={
																				msgIndex
																			}
																			className="flex items-start gap-2 text-sm">
																			<span className="text-red-500 mt-0.5">
																				•
																			</span>
																			<span className="text-red-700">
																				{
																					message
																				}
																			</span>
																		</div>
																	)
																)}
															</div>

															{/* Technical Details for Hash Errors */}
															{errorBlock.hashDetails && (
																<div className="mt-3 p-2 bg-gray-100 rounded text-xs">
																	<div className="font-medium text-gray-800 mb-1">
																		Chi tiết
																		lỗi
																		Hash:
																	</div>
																	<div className="text-gray-600">
																		<div>
																			Stored:{" "}
																			{errorBlock.hashDetails.stored.substring(
																				0,
																				16
																			)}
																			...
																		</div>
																		<div>
																			Calculated:{" "}
																			{errorBlock.hashDetails.calculated.substring(
																				0,
																				16
																			)}
																			...
																		</div>
																	</div>
																</div>
															)}
														</div>

														{/* Severity Badge */}
														<div
															className={`ml-4 px-2 py-1 rounded text-xs font-medium ${
																errorBlock.severity ===
																"HIGH"
																	? "bg-red-200 text-red-800"
																	: errorBlock.severity ===
																	  "MEDIUM"
																	? "bg-yellow-200 text-yellow-800"
																	: "bg-orange-200 text-orange-800"
															}`}>
															{errorBlock.severity ===
															"HIGH"
																? "Nghiêm trọng"
																: errorBlock.severity ===
																  "MEDIUM"
																? "Trung bình"
																: "Nhẹ"}
														</div>
													</div>
												</div>
											)
										)}
									</div>
								</div>
							)}

						{/* Summary Information */}
						{timeRangeVerification.summary && (
							<div className="bg-white rounded-lg p-4 border mb-4">
								<h4 className="font-medium text-gray-900 mb-3">
									Tóm tắt timeline và tình trạng
								</h4>

								{/* Overall Status */}
								<div
									className={`mb-4 p-3 rounded-lg ${
										timeRangeVerification.overallValid
											? "bg-green-50 border border-green-200"
											: "bg-red-50 border border-red-200"
									}`}>
									<div
										className={`font-medium ${
											timeRangeVerification.overallValid
												? "text-green-800"
												: "text-red-800"
										}`}>
										{timeRangeVerification.overallValid
											? "✅ Tất cả blocks hợp lệ"
											: `❌ Phát hiện ${timeRangeVerification.statistics.invalidBlocks} blocks có lỗi`}
									</div>
								</div>

								<div className="grid md:grid-cols-2 gap-4 text-sm">
									<div>
										<span className="font-medium">
											Hồ sơ đầu tiên:
										</span>
										<div className="text-gray-600 flex items-center gap-2">
											{timeRangeVerification.summary
												.firstBlock?.isValid ===
												false && (
												<span className="text-red-500 text-xs">
													❌
												</span>
											)}
											<span>
												{
													timeRangeVerification
														.summary.firstBlock
														?.diagnosis
												}{" "}
												-{" "}
												{formatDateTime(
													timeRangeVerification
														.summary.firstBlock
														?.timestamp
												)}
											</span>
										</div>
									</div>
									<div>
										<span className="font-medium">
											Hồ sơ gần nhất:
										</span>
										<div className="text-gray-600 flex items-center gap-2">
											{timeRangeVerification.summary
												.lastBlock?.isValid ===
												false && (
												<span className="text-red-500 text-xs">
													❌
												</span>
											)}
											<span>
												{
													timeRangeVerification
														.summary.lastBlock
														?.diagnosis
												}{" "}
												-{" "}
												{formatDateTime(
													timeRangeVerification
														.summary.lastBlock
														?.timestamp
												)}
											</span>
										</div>
									</div>
								</div>

								{timeRangeVerification.summary.timespan && (
									<div className="mt-2 text-sm">
										<span className="font-medium">
											Khoảng thời gian:
										</span>
										<span className="text-gray-600 ml-2">
											{
												timeRangeVerification.summary
													.timespan.duration
											}
										</span>
									</div>
								)}
							</div>
						)}

						{/* Timeline of blocks in range */}
						{timeRangeVerification.verificationResults.length >
							0 && (
							<div className="bg-white rounded-lg p-4 border">
								<h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
									<Clock size={18} />
									<span>
										Timeline các hồ sơ (
										{
											timeRangeVerification
												.verificationResults.length
										}{" "}
										blocks)
									</span>
								</h4>
								<div className="space-y-3 max-h-80 overflow-y-auto">
									{timeRangeVerification.verificationResults.map(
										(result, index) => (
											<div
												key={index}
												className={`border rounded-lg p-4 ${
													result.isValid
														? "bg-green-50 border-green-200"
														: "bg-red-50 border-red-200"
												}`}>
												<div className="flex justify-between items-start">
													<div className="flex-1">
														<div className="flex items-center space-x-2 mb-2">
															{result.isValid ? (
																<Check
																	className="text-green-600"
																	size={16}
																/>
															) : (
																<AlertTriangle
																	className="text-red-600"
																	size={16}
																/>
															)}
															<span className="font-medium">
																Block #
																{
																	result.blockIndex
																}{" "}
																-{" "}
																{
																	result.diagnosis
																}
															</span>
														</div>
														<div className="text-sm text-gray-600 space-y-1">
															<div>
																Hành động:{" "}
																{getActionText(
																	result.action
																)}{" "}
																•{" "}
																{formatDateTime(
																	result.timestamp
																)}
															</div>
															{result.updatedBy && (
																<div>
																	Cập nhật
																	bởi:{" "}
																	{
																		result
																			.updatedBy
																			.name
																	}{" "}
																	(
																	{
																		result
																			.updatedBy
																			.email
																	}
																	)
																</div>
															)}
														</div>
														{!result.isValid &&
															result.issues
																?.length >
																0 && (
																<div className="text-sm text-red-600 mt-2">
																	Vấn đề:{" "}
																	{result.issues.join(
																		", "
																	)}
																</div>
															)}
													</div>
													<div className="text-xs text-gray-400 ml-4">
														#{result.blockIndex}
													</div>
												</div>
											</div>
										)
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Quick Action Buttons */}
			<div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
				<h3 className="text-lg font-semibold text-blue-900 mb-3">
					💡 Hướng dẫn sử dụng
				</h3>
				<div className="space-y-2 text-blue-800 text-sm">
					<p>
						• <strong>Chọn khoảng thời gian:</strong> Có thể chọn
						chỉ ngày bắt đầu, chỉ ngày kết thúc, hoặc cả hai
					</p>
					<p>
						• <strong>Xác thực:</strong> Kiểm tra tính toàn vẹn của
						tất cả blocks trong khoảng thời gian
					</p>
					<p>
						• <strong>Xem chi tiết:</strong> Mỗi block sẽ hiển thị
						trạng thái validation và thông tin lỗi (nếu có)
					</p>
					<p>
						• <strong>Phân loại lỗi:</strong> Lỗi được chia thành 3
						mức độ - Nghiêm trọng, Trung bình, và Nhẹ
					</p>
				</div>
			</div>
		</div>
	);
};

export default TimeRangeVerification;
