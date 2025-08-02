import {
   Activity,
   AlertTriangle,
   Check,
   Database,
   FileText,
   Loader2,
   Shield,
   TrendingUp,
   User
} from "lucide-react";
import { useState } from "react";
import Swal from "sweetalert2";
import {
   apiVerifyAllPatientBlocks,
   apiVerifyRecord
} from "../../apis/blockchain";
import useAuth from "../../hooks/useAuth";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import TimeRangeVerification from "./TimeRangeVerification";

const BlockchainTab = ({ medicalRecords }) => {
	const { user } = useAuth();
	const [blockchainStatus, setBlockchainStatus] = useState(null);
	const [allBlocksVerification, setAllBlocksVerification] = useState(null);
	const [recordVerifications, setRecordVerifications] = useState({});

	// Loading states
	const [loading, setLoading] = useState(false);
	const [verifyingAllBlocks, setVerifyingAllBlocks] = useState(false);
	const [verifyingRecords, setVerifyingRecords] = useState(new Set());

	const getActionText = (action) => {
		const actionMap = {
			create: "Tạo mới",
			update: "Cập nhật",
			delete: "Xóa",
			view: "Xem",
		};
		return actionMap[action] || action;
	};

	const getStatusText = (status) => {
		const statusMap = {
			ongoing: "Đang điều trị",
			completed: "Hoàn thành",
		};
		return statusMap[status] || status;
	};

	const handleVerifyBlockchain = async () => {
		setLoading(true);
		setBlockchainStatus(null);
		try {
			// Mock successful verification
			setBlockchainStatus({
				valid: true,
				message: "Blockchain hoàn toàn hợp lệ",
				totalBlocks: 150,
				details:
					"Tất cả các blocks đều có hash hợp lệ và liên kết đúng",
			});
		} catch (error) {
			console.error("Error verifying blockchain:", error);
			setBlockchainStatus({
				valid: false,
				message: "Phát hiện vấn đề với blockchain",
				totalBlocks: 150,
				details: "Có 2 blocks không hợp lệ",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleVerifyAllPatientBlocks = () => {
		if (!user?._id) return;

		setVerifyingAllBlocks(true);
		setAllBlocksVerification(null);

		setTimeout(async () => {
			try {
				// await simulateAPICall(1500);
				const response = await apiVerifyAllPatientBlocks(user._id);
				if (!response.success) {
					Swal.fire({
						icon: "error",
						title: "Lỗi",
						text:
							response.message || "Không thể xác thực các blocks",
					});
					return;
				}
				setAllBlocksVerification(response.data);
				Swal.fire({
					icon: "success",
					title: "Xác thực các blocks thành công",
					text: `Đã xác thực ${response.data.statistics.validBlocks} blocks hợp lệ trong tổng số ${response.data.statistics.totalBlocks} blocks.`,
				});
			} catch (error) {
				console.error("Error verifying patient blocks:", error);
			} finally {
				setVerifyingAllBlocks(false);
			}
		}, 1500);
	};

	const handleVerifyRecord = (recordId) => {
		setVerifyingRecords((prev) => new Set([...prev, recordId]));
		setTimeout(async () => {
			try {
				const response = await apiVerifyRecord(recordId);
				if (!response.success) {
					Swal.fire({
						icon: "error",
						title: "Lỗi",
						text: response.message || "Không thể xác thực hồ sơ",
					});
					return;
				}
				setRecordVerifications((prev) => ({
					...prev,
					[recordId]: response.data,
				}));
			} catch (error) {
				console.error("Error verifying record:", error);
				setRecordVerifications((prev) => ({
					...prev,
					[recordId]: {
						isValid: false,
						verified: "Hồ sơ có thể đã bị thay đổi",
						blockIndex: Math.floor(Math.random() * 100) + 1,
					},
				}));
			} finally {
				setVerifyingRecords((prev) => {
					const newSet = new Set(prev);
					newSet.delete(recordId);
					return newSet;
				});
			}
		}, 1500);
	};

	return (
		<div className="p-6 max-w-7xl mx-auto">
			<div className="mb-6">
				<h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
					<Shield
						className="text-blue-600"
						size={32}
					/>
					<span>Kiểm tra Tính toàn vẹn Blockchain</span>
				</h2>
				<p className="text-gray-600">
					Xác thực tính bảo mật và toàn vẹn của hồ sơ y tế thông qua
					công nghệ blockchain
				</p>
			</div>

			{/* Information Banner */}
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
				<div className="flex items-start space-x-4">
					<Database
						className="text-blue-600 mt-1"
						size={24}
					/>
					<div>
						<h3 className="font-semibold text-blue-900 mb-2">
							Blockchain là gì và tại sao quan trọng?
						</h3>
						<p className="text-blue-800 leading-relaxed">
							Blockchain đảm bảo hồ sơ y tế của bạn không bị thay
							đổi trái phép. Mỗi hồ sơ được mã hóa và liên kết với
							nhau tạo thành chuỗi bảo mật, giúp phát hiện bất kỳ
							thay đổi nào không được ủy quyền.
						</p>
					</div>
				</div>
			</div>

			{/* Overall Verification Section */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
				<h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
					<Activity
						className="text-green-600"
						size={24}
					/>
					<span>Kiểm tra tổng thể</span>
				</h3>

				<div className="grid md:grid-cols-2 gap-6 mb-6">
					{/* Verify entire blockchain */}
					<div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
						<h4 className="font-medium text-green-900 mb-3">
							Toàn bộ hệ thống
						</h4>
						<button
							onClick={handleVerifyBlockchain}
							disabled={loading || true}
							className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
							{loading ? (
								<Loader2
									className="animate-spin"
									size={20}
								/>
							) : (
								<Shield size={20} />
							)}
							<span>
								{loading
									? "Đang kiểm tra..."
									: "Kiểm tra toàn bộ Blockchain"}
							</span>
						</button>
					</div>

					{/* Verify patient blocks */}
					<div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-6 border border-blue-200">
						<h4 className="font-medium text-blue-900 mb-3">
							Hồ sơ của tôi
						</h4>
						<button
							onClick={handleVerifyAllPatientBlocks}
							disabled={verifyingAllBlocks}
							className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
							{verifyingAllBlocks ? (
								<Loader2
									className="animate-spin"
									size={20}
								/>
							) : (
								<User size={20} />
							)}
							<span>
								{verifyingAllBlocks
									? "Đang xác thực..."
									: "Xác thực tất cả hồ sơ của tôi"}
							</span>
						</button>
					</div>
				</div>

				{/* Blockchain Status Results */}
				{blockchainStatus && (
					<div
						className={`rounded-xl p-6 mb-6 border-2 ${
							blockchainStatus.valid
								? "bg-green-50 border-green-200"
								: "bg-red-50 border-red-200"
						}`}>
						<div className="flex items-center space-x-3 mb-4">
							{blockchainStatus.valid ? (
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
									blockchainStatus.valid
										? "text-green-900"
										: "text-red-900"
								}`}>
								{blockchainStatus.message}
							</h3>
						</div>

						<div className="grid md:grid-cols-2 gap-4 mb-4">
							<div className="bg-white rounded-lg p-4 border">
								<div className="text-2xl font-bold text-gray-900">
									{blockchainStatus.totalBlocks}
								</div>
								<div className="text-sm text-gray-600">
									Tổng số blocks
								</div>
							</div>
							<div className="bg-white rounded-lg p-4 border">
								<div
									className={`text-2xl font-bold ${
										blockchainStatus.valid
											? "text-green-600"
											: "text-red-600"
									}`}>
									{blockchainStatus.valid ? "100%" : "95%"}
								</div>
								<div className="text-sm text-gray-600">
									Độ tin cậy
								</div>
							</div>
						</div>

						<div
							className={`text-sm ${
								blockchainStatus.valid
									? "text-green-800"
									: "text-red-800"
							}`}>
							<strong>Chi tiết:</strong>{" "}
							{blockchainStatus.details}
						</div>

						{blockchainStatus.valid && (
							<div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-200">
								<p className="text-green-800 font-medium flex items-center space-x-2">
									<Check size={16} />
									<span>
										Hồ sơ y tế của bạn an toàn và không bị
										thay đổi trái phép
									</span>
								</p>
							</div>
						)}
					</div>
				)}

				{/* All Patient Blocks Verification Results */}
				{allBlocksVerification && (
					<div
						className={`rounded-xl p-6 border-2 ${
							allBlocksVerification.overallValid
								? "bg-green-50 border-green-200"
								: "bg-red-50 border-red-200"
						}`}>
						<div className="flex items-center space-x-3 mb-6">
							{allBlocksVerification.overallValid ? (
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
									allBlocksVerification.overallValid
										? "text-green-900"
										: "text-red-900"
								}`}>
								Kết quả xác thực tất cả hồ sơ của bạn
							</h3>
						</div>

						{/* Statistics Grid */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
							<div className="bg-white rounded-lg p-4 border text-center">
								<div className="text-3xl font-bold text-gray-900">
									{
										allBlocksVerification.statistics
											.totalBlocks
									}
								</div>
								<div className="text-sm text-gray-600 mt-1">
									Tổng số blocks
								</div>
							</div>
							<div className="bg-white rounded-lg p-4 border text-center">
								<div className="text-3xl font-bold text-green-600">
									{
										allBlocksVerification.statistics
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
										allBlocksVerification.statistics
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
										allBlocksVerification.statistics
											.validityPercentage
									}
									%
								</div>
								<div className="text-sm text-gray-600 mt-1">
									Độ tin cậy
								</div>
							</div>
						</div>

						{/* Summary Information
						{allBlocksVerification.summary && (
							<div className="bg-white rounded-lg p-4 border mb-4">
								<h4 className="font-medium text-gray-900 mb-3">
									Tóm tắt timeline
								</h4>
								<div className="grid md:grid-cols-2 gap-4 text-sm">
									<div>
										<span className="font-medium">
											Hồ sơ đầu tiên:
										</span>
										<div className="text-gray-600">
											{
												allBlocksVerification.summary
													.firstBlock?.diagnosis
											}{" "}
											-{" "}
											{formatDateTime(
												allBlocksVerification.summary
													.firstBlock?.timestamp
											)}
										</div>
									</div>
									<div>
										<span className="font-medium">
											Hồ sơ gần nhất:
										</span>
										<div className="text-gray-600">
											{
												allBlocksVerification.summary
													.lastBlock?.diagnosis
											}{" "}
											-{" "}
											{formatDateTime(
												allBlocksVerification.summary
													.lastBlock?.timestamp
											)}
										</div>
									</div>
								</div>
								{allBlocksVerification.summary.timespan && (
									<div className="mt-2 text-sm">
										<span className="font-medium">
											Khoảng thời gian:
										</span>
										<span className="text-gray-600 ml-2">
											{
												allBlocksVerification.summary
													.timespan.duration
											}
										</span>
									</div>
								)}
							</div>
						)} */}

						{/* Error Blocks Summary - Hiển thị blocks có lỗi */}
						{allBlocksVerification.errorBlocks &&
							allBlocksVerification.errorBlocks.length > 0 && (
								<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
									<h4 className="font-medium text-red-800 mb-3 flex items-center">
										<svg
											className="w-5 h-5 mr-2"
											fill="currentColor"
											viewBox="0 0 20 20">
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clipRule="evenodd"
											/>
										</svg>
										Danh sách blocks có lỗi (
										{
											allBlocksVerification.errorBlocks
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
													allBlocksVerification.errorBlocks.filter(
														(block) =>
															block.severity ===
															"HIGH"
													).length
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
													allBlocksVerification.errorBlocks.filter(
														(block) =>
															block.severity ===
															"MEDIUM"
													).length
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
													allBlocksVerification.errorBlocks.filter(
														(block) =>
															block.severity ===
															"LOW"
													).length
												}
											</div>
											<div className="text-orange-600 text-sm">
												Thiếu dữ liệu
											</div>
										</div>
									</div>

									{/* Error Blocks List */}
									<div className="space-y-3">
										{allBlocksVerification.errorBlocks.map(
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
																	{
																		errorBlock.action
																	}
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

															{/* Technical Details for Previous Hash Errors */}
															{errorBlock.previousHashDetails && (
																<div className="mt-3 p-2 bg-gray-100 rounded text-xs">
																	<div className="font-medium text-gray-800 mb-1">
																		Chi tiết
																		lỗi
																		Previous
																		Hash:
																	</div>
																	<div className="text-gray-600">
																		<div>
																			Stored:{" "}
																			{
																				errorBlock
																					.previousHashDetails
																					.stored
																			}
																		</div>
																		<div>
																			Expected:{" "}
																			{
																				errorBlock
																					.previousHashDetails
																					.expected
																			}
																		</div>
																		{!errorBlock
																			.previousHashDetails
																			.previousBlockExists && (
																			<div className="text-red-600">
																				Block
																				trước
																				không
																				tồn
																				tại!
																			</div>
																		)}
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

									{/* Quick Fix Suggestions */}
									{allBlocksVerification.summary
										?.errorSummary && (
										<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
											<h5 className="font-medium text-blue-800 mb-2">
												Đề xuất khắc phục:
											</h5>
											<div className="text-sm text-blue-700 space-y-1">
												{allBlocksVerification.summary
													.errorSummary
													.highSeverityErrors > 0 && (
													<div>
														• Kiểm tra dữ liệu
														blocks có hash lỗi - có
														thể đã bị thay đổi trái
														phép
													</div>
												)}
												{allBlocksVerification.summary
													.errorSummary
													.mediumSeverityErrors >
													0 && (
													<div>
														• Kiểm tra tính liên tục
														của blockchain - có
														blocks bị thiếu hoặc sai
														thứ tự
													</div>
												)}
												{allBlocksVerification.summary
													.errorSummary
													.lowSeverityErrors > 0 && (
													<div>
														• Khôi phục dữ liệu
														medical records bị thiếu
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							)}

						{/* Enhanced Summary Information */}
						{allBlocksVerification.summary && (
							<div className="bg-white rounded-lg p-4 border mb-4">
								<h4 className="font-medium text-gray-900 mb-3">
									Tóm tắt timeline và tình trạng
								</h4>

								{/* Overall Status */}
								<div
									className={`mb-4 p-3 rounded-lg ${
										allBlocksVerification.overallValid
											? "bg-green-50 border border-green-200"
											: "bg-red-50 border border-red-200"
									}`}>
									<div
										className={`font-medium ${
											allBlocksVerification.overallValid
												? "text-green-800"
												: "text-red-800"
										}`}>
										{allBlocksVerification.overallValid
											? "✅ Tất cả blocks hợp lệ"
											: `❌ Phát hiện ${allBlocksVerification.statistics.invalidBlocks} blocks có lỗi`}
									</div>
									{!allBlocksVerification.overallValid &&
										allBlocksVerification.summary
											.errorSummary && (
											<div className="text-red-700 text-sm mt-1">
												Nghiêm trọng:{" "}
												{
													allBlocksVerification
														.summary.errorSummary
														.highSeverityErrors
												}
												, Trung bình:{" "}
												{
													allBlocksVerification
														.summary.errorSummary
														.mediumSeverityErrors
												}
												, Nhẹ:{" "}
												{
													allBlocksVerification
														.summary.errorSummary
														.lowSeverityErrors
												}
											</div>
										)}
								</div>

								<div className="grid md:grid-cols-2 gap-4 text-sm">
									<div>
										<span className="font-medium">
											Hồ sơ đầu tiên:
										</span>
										<div className="text-gray-600 flex items-center gap-2">
											{allBlocksVerification.summary
												.firstBlock?.isValid ===
												false && (
												<span className="text-red-500 text-xs">
													❌
												</span>
											)}
											<span>
												{
													allBlocksVerification
														.summary.firstBlock
														?.diagnosis
												}
												-{" "}
												{formatDateTime(
													allBlocksVerification
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
											{allBlocksVerification.summary
												.lastBlock?.isValid ===
												false && (
												<span className="text-red-500 text-xs">
													❌
												</span>
											)}
											<span>
												{
													allBlocksVerification
														.summary.lastBlock
														?.diagnosis
												}
												-{" "}
												{formatDateTime(
													allBlocksVerification
														.summary.lastBlock
														?.timestamp
												)}
											</span>
										</div>
									</div>
								</div>

								{allBlocksVerification.summary.timespan && (
									<div className="mt-2 text-sm">
										<span className="font-medium">
											Khoảng thời gian:
										</span>
										<span className="text-gray-600 ml-2">
											{
												allBlocksVerification.summary
													.timespan.duration
											}
										</span>
									</div>
								)}

								{/* Error Types Breakdown */}
								{!allBlocksVerification.overallValid &&
									allBlocksVerification.statistics
										.errorsByType && (
										<div className="mt-4 text-sm">
											<span className="font-medium">
												Phân loại lỗi:
											</span>
											<div className="mt-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
												{Object.entries(
													allBlocksVerification
														.statistics.errorsByType
												).map(([errorType, count]) => (
													<div
														key={errorType}
														className="flex justify-between items-center bg-gray-100 px-2 py-1 rounded">
														<span className="text-gray-700">
															{errorType ===
															"INVALID_HASH"
																? "Hash lỗi"
																: errorType ===
																  "INVALID_PREVIOUS_HASH"
																? "Blockchain đứt gãy"
																: errorType ===
																  "MISSING_RECORD"
																? "Thiếu record"
																: errorType}
														</span>
														<span className="font-medium text-red-600">
															{count}
														</span>
													</div>
												))}
											</div>
										</div>
									)}
							</div>
						)}

						{/* Action Breakdown */}
						{allBlocksVerification.summary?.actionBreakdown && (
							<div className="bg-white rounded-lg p-4 border">
								<h4 className="font-medium text-gray-900 mb-3">
									Thống kê hoạt động
								</h4>
								<div className="flex space-x-4 text-sm">
									{Object.entries(
										allBlocksVerification.summary
											.actionBreakdown
									).map(([action, count]) => (
										<div
											key={action}
											className="flex items-center space-x-2">
											<div className="w-3 h-3 bg-blue-500 rounded-full"></div>
											<span>
												{getActionText(action)}: {count}
											</span>
										</div>
									))}
								</div>
							</div>
						)}

						{allBlocksVerification.statistics.invalidBlocks > 0 && (
							<div className="mt-4 bg-red-100 border border-red-300 rounded-lg p-4">
								<p className="text-red-800 font-medium flex items-center space-x-2">
									<AlertTriangle size={16} />
									<span>
										Phát hiện{" "}
										{
											allBlocksVerification.statistics
												.invalidBlocks
										}{" "}
										blocks có vấn đề. Vui lòng liên hệ quản
										trị viên để kiểm tra.
									</span>
								</p>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Time Range Verification Section */}
			<TimeRangeVerification />

			{/* Individual Records Verification Section */}
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
					<FileText
						className="text-orange-600"
						size={24}
					/>
					<span>Kiểm tra từng hồ sơ</span>
				</h3>

				{medicalRecords.length === 0 ? (
					<div className="text-center py-12">
						<Shield
							size={64}
							className="mx-auto mb-4 text-gray-300"
						/>
						<h4 className="text-lg font-medium text-gray-900 mb-2">
							Chưa có hồ sơ y tế nào
						</h4>
						<p className="text-gray-500">
							Khi bạn có hồ sơ y tế, chúng sẽ xuất hiện ở đây để
							kiểm tra tính toàn vẹn
						</p>
					</div>
				) : (
					<div className="space-y-4">
						{medicalRecords.map((record) => (
							<div
								key={record._id}
								className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
								{/* Record Header */}
								<div className="flex justify-between items-start mb-4">
									<div className="flex-1">
										<div className="flex items-center space-x-3 mb-3">
											<h4 className="text-lg font-semibold text-gray-900">
												{record.diagnosis}
											</h4>
											<span
												className={`px-3 py-1 rounded-full text-xs font-medium ${
													record.status ===
													"completed"
														? "bg-green-100 text-green-800"
														: record.status ===
														  "active"
														? "bg-blue-100 text-blue-800"
														: "bg-yellow-100 text-yellow-800"
												}`}>
												{getStatusText(record.status)}
											</span>
										</div>

										{/* Record Details Grid */}
										<div className="grid md:grid-cols-2 gap-6">
											<div className="space-y-3">
												<div>
													<span className="text-sm font-medium text-gray-500">
														Bác sĩ điều trị
													</span>
													<div className="text-gray-900">
														{record.doctorId.name}
													</div>
												</div>
												<div>
													<span className="text-sm font-medium text-gray-500">
														Phương pháp điều trị
													</span>
													<div className="text-gray-900">
														{record.treatment}
													</div>
												</div>
												<div>
													<span className="text-sm font-medium text-gray-500">
														Thuốc kê đơn
													</span>
													<div className="text-gray-900">
														{record.medication}
													</div>
												</div>
											</div>

											<div className="space-y-3">
												<div>
													<span className="text-sm font-medium text-gray-500">
														Ghi chú của bác sĩ
													</span>
													<div className="text-gray-900">
														{record.doctorNote}
													</div>
												</div>
												<div>
													<span className="text-sm font-medium text-gray-500">
														Ngày khám
													</span>
													<div className="text-gray-900">
														{formatDate(
															record.createdAt
														)}
													</div>
												</div>
												<div>
													<span className="text-sm font-medium text-gray-500">
														Lịch tái khám
													</span>
													<div className="text-gray-900">
														{formatDate(
															record.dateBack
														)}
													</div>
												</div>
											</div>
										</div>
									</div>

									{/* Verify Button */}
									<div className="ml-6">
										<button
											onClick={() =>
												handleVerifyRecord(record._id)
											}
											disabled={verifyingRecords.has(
												record._id
											)}
											className="flex items-center space-x-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
											{verifyingRecords.has(
												record._id
											) ? (
												<Loader2
													className="animate-spin"
													size={18}
												/>
											) : (
												<Shield size={18} />
											)}
											<span className="font-medium">
												{verifyingRecords.has(
													record._id
												)
													? "Đang kiểm tra..."
													: "Kiểm tra blockchain"}
											</span>
										</button>
									</div>
								</div>

								{/* Verification Result */}
								{recordVerifications[record._id] && (
									<div
										className={`mt-6 p-4 rounded-lg border-2 ${
											recordVerifications[record._id]
												.isValid
												? "bg-green-50 border-green-200"
												: "bg-red-50 border-red-200"
										}`}>
										<div className="flex items-center space-x-3 mb-3">
											{recordVerifications[record._id]
												.isValid ? (
												<Check
													className="text-green-600"
													size={20}
												/>
											) : (
												<AlertTriangle
													className="text-red-600"
													size={20}
												/>
											)}
											<span
												className={`font-semibold text-lg ${
													recordVerifications[
														record._id
													].isValid
														? "text-green-900"
														: "text-red-900"
												}`}>
												{
													recordVerifications[
														record._id
													].verified
												}
											</span>
										</div>

										<div className="grid md:grid-cols-2 gap-4 text-sm">
											<div>
												<span className="font-medium text-gray-700">
													Block index:
												</span>
												<span
													className={`ml-2 ${
														recordVerifications[
															record._id
														].isValid
															? "text-green-800"
															: "text-red-800"
													}`}>
													#
													{
														recordVerifications[
															record._id
														].blockIndex
													}
												</span>
											</div>
											<div>
												<span className="font-medium text-gray-700">
													Trạng thái bảo mật:
												</span>
												<span
													className={`ml-2 font-medium ${
														recordVerifications[
															record._id
														].isValid
															? "text-green-800"
															: "text-red-800"
													}`}>
													{recordVerifications[
														record._id
													].isValid
														? "An toàn"
														: "Có rủi ro"}
												</span>
											</div>
										</div>

										{recordVerifications[record._id]
											.isValid ? (
											<div className="mt-3 flex items-center space-x-2 text-green-800 text-sm">
												<Check size={16} />
												<span>
													Hồ sơ này đã được xác thực
													và không có dấu hiệu bị thay
													đổi trái phép
												</span>
											</div>
										) : (
											<div className="mt-3 flex items-center space-x-2 text-red-800 text-sm">
												<AlertTriangle size={16} />
												<span>
													Hồ sơ này có thể đã bị thay
													đổi. Vui lòng liên hệ quản
													trị viên để kiểm tra
												</span>
											</div>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Summary Statistics */}
			<div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
				<h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
					<TrendingUp
						className="text-blue-600"
						size={20}
					/>
					<span>Tóm tắt bảo mật</span>
				</h3>

				<div className="grid md:grid-cols-4 gap-4">
					<div className="bg-white rounded-lg p-4 border text-center">
						<div className="text-2xl font-bold text-blue-600">
							{medicalRecords.length}
						</div>
						<div className="text-sm text-gray-600 mt-1">
							Tổng hồ sơ
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 border text-center">
						<div className="text-2xl font-bold text-green-600">
							{
								Object.values(recordVerifications).filter(
									(v) => v.isValid
								).length
							}
						</div>
						<div className="text-sm text-gray-600 mt-1">
							Đã xác thực
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 border text-center">
						<div className="text-2xl font-bold text-orange-600">
							{medicalRecords.length -
								Object.keys(recordVerifications).length}
						</div>
						<div className="text-sm text-gray-600 mt-1">
							Chưa kiểm tra
						</div>
					</div>

					<div className="bg-white rounded-lg p-4 border text-center">
						<div className="text-2xl font-bold text-red-600">
							{
								Object.values(recordVerifications).filter(
									(v) => !v.isValid
								).length
							}
						</div>
						<div className="text-sm text-gray-600 mt-1">
							Có vấn đề
						</div>
					</div>
				</div>
			</div>

			{/* Help Section */}
			<div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-200">
				<h3 className="text-lg font-semibold text-blue-900 mb-3">
					💡 Hướng dẫn sử dụng
				</h3>
				<div className="space-y-2 text-blue-800 text-sm">
					<p>
						• <strong>Kiểm tra toàn bộ Blockchain:</strong> Xác thực
						tính toàn vẹn của toàn bộ hệ thống
					</p>
					<p>
						• <strong>Xác thực tất cả hồ sơ:</strong> Kiểm tra tất
						cả blocks liên quan đến hồ sơ của bạn
					</p>
					<p>
						• <strong>Kiểm tra theo thời gian:</strong> Lọc và xác
						thực blocks trong khoảng thời gian cụ thể
					</p>
					<p>
						• <strong>Kiểm tra từng hồ sơ:</strong> Xác thực tính
						toàn vẹn của từng hồ sơ y tế riêng lẻ
					</p>
				</div>
			</div>
		</div>
	);
};

export default BlockchainTab;
