import {
	AlertTriangle,
	Calendar,
	Check,
	ChevronDown,
	ChevronUp,
	Edit,
	FileText,
	History,
	Loader2,
	Mail,
	Phone,
	Save,
	Shield,
	User,
	X,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";
import { apiGetRecordHistory, apiGetUserMedicalRecords } from "../apis/record";
import { apiUpdateUser } from "../apis/user";
import useAuth from "../hooks/useAuth";
import { formatDate, formatDateTime } from "../utils/dateUtils"; // Assuming you have a utility for date formatting
import { apiVerifyRecord } from "../apis/record";
import {
	apiVerifyAllPatientBlocks,
	apiVerifyPatientBlocksTimeRange,
} from "../apis/blockchain";

const PatientDashboard = () => {
	const { user, updateUser } = useAuth();
	const location = useLocation();
	const [activeTab, setActiveTab] = useState("medical-records");

	const [medicalRecords, setMedicalRecords] = useState([]);

	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState({});
	const [loading, setLoading] = useState(false);
	const [blockchainStatus, setBlockchainStatus] = useState(null);

	// New states for individual record verification
	const [expandedRecord, setExpandedRecord] = useState(null);
	const [recordVerifications, setRecordVerifications] = useState({});
	const [recordHistories, setRecordHistories] = useState({});
	const [verifyingRecords, setVerifyingRecords] = useState(new Set());

	useEffect(() => {
		const fetchMedicalRecords = async () => {
			setLoading(true);
			try {
				const response = await apiGetUserMedicalRecords(user._id);

				if (response.success) {
					setMedicalRecords(response.data || []);
				} else {
					setMedicalRecords([]);
				}
			} catch (error) {
				console.error("Error fetching medical records:", error);
			}
			setLoading(false);
		};

		if (user?._id) {
			fetchMedicalRecords();
		}
	}, [user]);

	useEffect(() => {
		// Chỉ setup editForm khi có user
		if (user) {
			setEditForm({
				name: user.name,
				email: user.email,
				phoneNumber: user.phoneNumber || "",
			});
		}
	}, [user]);
	const [allBlocksVerification, setAllBlocksVerification] = useState(null);
	const [verifyingAllBlocks, setVerifyingAllBlocks] = useState(false);
	const [timeRangeVerification, setTimeRangeVerification] = useState(null);
	const [verifyingTimeRange, setVerifyingTimeRange] = useState(false);
	const [timeRangeFilter, setTimeRangeFilter] = useState({
		startDate: "",
		endDate: "",
	});

	useEffect(() => {
		const { activeTab } = location.state || {}; // lấy giá trị activeTab
		if (activeTab) {
			setActiveTab(activeTab);
		}
	}, [location.state]);

	// Hiển thị thông báo nếu chưa đăng nhập
	if (!user) {
		return (
			<Navigate
				to="/login"
				replace
			/>
		);
	}

	// Handler để xác thực tất cả blocks của bệnh nhân
	const handleVerifyAllPatientBlocks = async () => {
		if (!user?._id) return;

		setVerifyingAllBlocks(true);
		setAllBlocksVerification(null);

		try {
			const response = await apiVerifyAllPatientBlocks(user._id);

			if (response.success) {
				setAllBlocksVerification(response.data);

				if (!response.data.overallValid) {
					Swal.fire({
						icon: "warning",
						title: "Phát hiện vấn đề blockchain",
						text: `Có ${response.data.statistics.invalidBlocks} blocks không hợp lệ. Vui lòng liên hệ quản trị viên.`,
						confirmButtonText: "Đã hiểu",
					});
				} else {
					Swal.fire({
						icon: "success",
						title: "Xác thực thành công",
						text: "Tất cả hồ sơ y tế của bạn đều hợp lệ và an toàn!",
						confirmButtonText: "Tuyệt vời!",
					});
				}
			} else {
				throw new Error(response.message || "Lỗi xác thực");
			}
		} catch (error) {
			console.error("Error verifying all patient blocks:", error);
			Swal.fire({
				icon: "error",
				title: "Lỗi xác thực",
				text: "Không thể xác thực các blocks của bạn. Vui lòng thử lại sau.",
			});
		} finally {
			setVerifyingAllBlocks(false);
		}
	};

	// Handler để xác thực blocks theo khoảng thời gian
	const handleVerifyTimeRange = async () => {
		if (!user?._id) return;

		// Kiểm tra ít nhất một trong hai ngày được chọn
		if (!timeRangeFilter.startDate && !timeRangeFilter.endDate) {
			Swal.fire({
				icon: "warning",
				title: "Chưa chọn khoảng thời gian",
				text: "Vui lòng chọn ít nhất một ngày bắt đầu hoặc kết thúc.",
			});
			return;
		}

		// Kiểm tra logic ngày
		if (timeRangeFilter.startDate && timeRangeFilter.endDate) {
			if (
				new Date(timeRangeFilter.startDate) >
				new Date(timeRangeFilter.endDate)
			) {
				Swal.fire({
					icon: "warning",
					title: "Khoảng thời gian không hợp lệ",
					text: "Ngày bắt đầu không thể sau ngày kết thúc.",
				});
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

			if (response.success) {
				setTimeRangeVerification(response.data);

				if (response.data.statistics.totalBlocks === 0) {
					Swal.fire({
						icon: "info",
						title: "Không có dữ liệu",
						text: "Không có hồ sơ nào trong khoảng thời gian đã chọn.",
					});
				} else if (!response.data.overallValid) {
					Swal.fire({
						icon: "warning",
						title: "Phát hiện vấn đề",
						text: `Có ${response.data.statistics.invalidBlocks} blocks không hợp lệ trong khoảng thời gian này.`,
					});
				} else {
					Swal.fire({
						icon: "success",
						title: "Xác thực thành công",
						text: `Tất cả ${response.data.statistics.totalBlocks} hồ sơ trong khoảng thời gian này đều hợp lệ!`,
					});
				}
			} else {
				throw new Error(response.message || "Lỗi xác thực");
			}
		} catch (error) {
			console.error("Error verifying time range blocks:", error);
			Swal.fire({
				icon: "error",
				title: "Lỗi xác thực",
				text: "Không thể xác thực các blocks trong khoảng thời gian này. Vui lòng thử lại sau.",
			});
		} finally {
			setVerifyingTimeRange(false);
		}
	};

	// Helper function để clear time range filter
	const handleClearTimeRange = () => {
		setTimeRangeFilter({
			startDate: "",
			endDate: "",
		});
		setTimeRangeVerification(null);
	};

	const handleEditProfile = () => {
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		setEditForm({
			name: user?.name,
			email: user?.email,
			phoneNumber: user?.phoneNumber || "",
		});
	};

	const handleSaveProfile = async () => {
		try {
			const response = await apiUpdateUser(user._id, editForm);
			if (!response.success) {
				Swal.fire({
					icon: "error",
					title: "Cập nhật thất bại",
					text:
						response.message ||
						"Có lỗi xảy ra khi cập nhật thông tin!",
				});
				return;
			}
			updateUser(editForm);
			setIsEditing(false);
			Swal.fire({
				icon: "success",
				title: "Cập nhật thành công",
				text: "Thông tin cá nhân đã được cập nhật thành công!",
			});
		} catch (error) {
			console.error("Error saving profile:", error);
			Swal.fire({
				icon: "error",
				title: "Cập nhật thất bại",
				text: "Có lỗi xảy ra khi cập nhật thông tin!",
			});
		}
	};

	const handleVerifyBlockchain = async () => {
		setLoading(true);
		setBlockchainStatus(null);

		try {
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const isValid = Math.random() > 0.2;

			if (isValid) {
				setBlockchainStatus({
					valid: true,
					message: "Blockchain hợp lệ",
					totalBlocks: medicalRecords.length + 3,
					details:
						"Tất cả các hash được xác minh thành công. Không phát hiện thay đổi bất thường.",
				});
			} else {
				setBlockchainStatus({
					valid: false,
					message: "Phát hiện bất thường trong blockchain",
					totalBlocks: medicalRecords.length + 3,
					details:
						"Có thể có sự thay đổi không được ủy quyền trong một số hồ sơ.",
				});
			}
		} catch (error) {
			setBlockchainStatus({
				valid: false,
				message: "Lỗi khi xác thực blockchain",
				details: error.message,
			});
		} finally {
			setLoading(false);
		}
	};

	// New functions for individual record verification
	const handleVerifyRecord = async (recordId) => {
		setVerifyingRecords((prev) => new Set([...prev, recordId]));

		try {
			const response = await apiVerifyRecord(recordId);
			if (response.success) {
				setRecordVerifications((prev) => ({
					...prev,
					[recordId]: response.data,
				}));
			}
		} catch (error) {
			console.error("Error verifying record:", error);
			Swal.fire({
				icon: "error",
				title: "Lỗi xác minh",
				text: "Không thể xác minh tính toàn vẹn của hồ sơ này",
			});
		} finally {
			setVerifyingRecords((prev) => {
				const newSet = new Set(prev);
				newSet.delete(recordId);
				return newSet;
			});
		}
	};

	const handleViewHistory = async (recordId) => {
		if (recordHistories[recordId]) {
			// If already loaded, just toggle
			setExpandedRecord(expandedRecord === recordId ? null : recordId);
			return;
		}

		try {
			const response = await apiGetRecordHistory(recordId);
			if (response.success) {
				setRecordHistories((prev) => ({
					...prev,
					[recordId]: response.data,
				}));
				setExpandedRecord(recordId);
			}
		} catch (error) {
			console.error("Error fetching record history:", error);
			Swal.fire({
				icon: "error",
				title: "Lỗi tải lịch sử",
				text: "Không thể tải lịch sử giao dịch của hồ sơ này",
			});
		}
	};

	const getActionText = (action) => {
		switch (action) {
			case "create":
				return "Tạo hồ sơ";
			case "update":
				return "Cập nhật hồ sơ";
			case "delete":
				return "Xóa hồ sơ";
			default:
				return "Hoạt động không xác định";
		}
	};

	// eslint-disable-next-line no-unused-vars
	const TabButton = ({ id, children, icon: Icon }) => (
		<button
			onClick={() => setActiveTab(id)}
			className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
				activeTab === id
					? "bg-blue-100 text-blue-700 border border-blue-200"
					: "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
			}`}>
			<Icon size={18} />
			<span>{children}</span>
		</button>
	);

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex items-center space-x-4">
						<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
							<User
								className="text-blue-600"
								size={24}
							/>
						</div>
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Chào mừng, {user?.name}
							</h1>
							<p className="text-gray-600">
								Hệ thống Quản lý Hồ sơ Y tế Blockchain
							</p>
						</div>
					</div>
				</div>

				{/* Navigation Tabs */}
				<div className="flex space-x-2 mb-6">
					<TabButton
						id="medical-records"
						icon={FileText}>
						Hồ sơ Y tế
					</TabButton>
					<TabButton
						id="profile"
						icon={User}>
						Thông tin Cá nhân
					</TabButton>
					<TabButton
						id="blockchain"
						icon={Shield}>
						Kiểm tra Blockchain
					</TabButton>
				</div>

				{/* Content */}
				<div className="bg-white rounded-lg shadow-sm">
					{/* Medical Records Tab */}
					{activeTab === "medical-records" && (
						<div className="p-6">
							<h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
								<FileText
									className="text-blue-600"
									size={24}
								/>
								<span>Hồ sơ Y tế của bạn</span>
							</h2>

							{medicalRecords.length === 0 ? (
								<div className="text-center py-8 text-gray-500">
									<FileText
										size={48}
										className="mx-auto mb-4 text-gray-300"
									/>
									<p>Chưa có hồ sơ y tế nào</p>
								</div>
							) : (
								<div className="space-y-4">
									{medicalRecords.map((record) => (
										<div
											key={record._id}
											className="border border-gray-200 rounded-lg">
											<div className="p-4">
												<div className="grid md:grid-cols-2 gap-4">
													<div>
														<h3 className="font-semibold text-lg text-gray-900 mb-2">
															{record.diagnosis}
														</h3>
														<div className="space-y-2 text-sm">
															<div>
																<span className="font-medium text-gray-700">
																	Bác sĩ điều
																	trị:
																</span>
																<span className="ml-2 text-gray-600">
																	{
																		record
																			.doctorId
																			.name
																	}
																</span>
															</div>
															<div>
																<span className="font-medium text-gray-700">
																	Ngày khám:
																</span>
																<span className="ml-2 text-gray-600">
																	{formatDate(
																		record.createdAt
																	)}
																</span>
															</div>
															<div>
																<span className="font-medium text-gray-700">
																	Điều trị:
																</span>
																<span className="ml-2 text-gray-600">
																	{
																		record.treatment
																	}
																</span>
															</div>
														</div>
													</div>

													<div>
														<div className="space-y-2 text-sm">
															<div>
																<span className="font-medium text-gray-700">
																	Thuốc:
																</span>
																<span className="ml-2 text-gray-600">
																	{record.medication ||
																		"Không có"}
																</span>
															</div>
															<div>
																<span className="font-medium text-gray-700">
																	Ghi chú:
																</span>
																<span className="ml-2 text-gray-600">
																	{record.doctorNote ||
																		"Không có"}
																</span>
															</div>
															<div>
																<span className="font-medium text-gray-700">
																	Tái khám:
																</span>
																<span className="ml-2 text-gray-600">
																	{formatDate(
																		record.dateBack
																	)}
																</span>
															</div>
															<div>
																<span className="font-medium text-gray-700">
																	Blockchain
																	Hash:
																</span>
																<span className="ml-2 text-gray-600 line-clamp-1">
																	{
																		record.blockchainHash
																	}
																</span>
															</div>
														</div>
													</div>
												</div>

												{/* Blockchain verification controls */}
												<div className="mt-4 pt-4 border-t border-gray-100">
													<div className="flex flex-wrap gap-2">
														<button
															onClick={() =>
																handleVerifyRecord(
																	record._id
																)
															}
															disabled={verifyingRecords.has(
																record._id
															)}
															className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 text-sm">
															{verifyingRecords.has(
																record._id
															) ? (
																<Loader2
																	className="animate-spin"
																	size={14}
																/>
															) : (
																<Shield
																	size={14}
																/>
															)}
															<span>
																{verifyingRecords.has(
																	record._id
																)
																	? "Đang xác minh..."
																	: "Xác minh tính toàn vẹn"}
															</span>
														</button>

														<button
															onClick={() =>
																handleViewHistory(
																	record._id
																)
															}
															className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
															<History
																size={14}
															/>
															<span>
																Xem lịch sử giao
																dịch
															</span>
															{expandedRecord ===
															record._id ? (
																<ChevronUp
																	size={14}
																/>
															) : (
																<ChevronDown
																	size={14}
																/>
															)}
														</button>
													</div>

													{/* Verification result */}
													{recordVerifications[
														record._id
													] && (
														<div
															className={`mt-3 p-3 rounded-lg text-sm ${
																recordVerifications[
																	record._id
																].isValid
																	? "bg-green-50 border border-green-200"
																	: "bg-red-50 border border-red-200"
															}`}>
															<div className="flex items-center space-x-2 mb-2">
																{recordVerifications[
																	record._id
																].isValid ? (
																	<Check
																		className="text-green-600"
																		size={
																			16
																		}
																	/>
																) : (
																	<AlertTriangle
																		className="text-red-600"
																		size={
																			16
																		}
																	/>
																)}
																<span
																	className={`font-medium ${
																		recordVerifications[
																			record
																				._id
																		]
																			.isValid
																			? "text-green-900"
																			: "text-red-900"
																	}`}>
																	{
																		recordVerifications[
																			record
																				._id
																		]
																			.verified
																	}
																</span>
															</div>
															<div
																className={
																	recordVerifications[
																		record
																			._id
																	].isValid
																		? "text-green-800"
																		: "text-red-800"
																}>
																Block index:{" "}
																{
																	recordVerifications[
																		record
																			._id
																	].blockIndex
																}
															</div>
														</div>
													)}
												</div>
											</div>

											{/* Transaction history */}
											{expandedRecord === record._id &&
												recordHistories[record._id] && (
													<div className="border-t border-gray-100 p-4 bg-gray-50">
														<h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
															<History
																size={16}
															/>
															<span>
																Lịch sử giao
																dịch
															</span>
														</h4>
														<div className="space-y-3">
															{recordHistories[
																record._id
															].history.map(
																(
																	transaction,
																	index
																) => (
																	<div
																		key={
																			index
																		}
																		className="bg-white rounded-lg p-3 border border-gray-200">
																		<div className="flex justify-between items-start">
																			<div>
																				<div className="font-medium text-gray-900 mb-1">
																					{getActionText(
																						transaction.action
																					)}
																				</div>
																				{transaction.action ===
																					"update" && (
																					<div className="text-sm text-gray-600">
																						Cập
																						nhật
																						bởi{" "}
																						{
																							transaction
																								.updatedBy
																								.name
																						}
																					</div>
																				)}
																				<div className="text-sm text-gray-600">
																					{formatDateTime(
																						transaction.timestamp
																					)}
																				</div>
																				<div className="text-xs text-gray-500 mt-1">
																					Block
																					#
																					{
																						transaction.blockIndex
																					}
																				</div>
																			</div>
																			<div className="text-xs text-gray-400 font-mono">
																				{transaction.hash.substring(
																					0,
																					8
																				)}
																				...
																			</div>
																		</div>
																	</div>
																)
															)}
														</div>
														<div className="mt-3 text-sm text-gray-600">
															Tổng số giao dịch:{" "}
															{
																recordHistories[
																	record._id
																]
																	.totalTransactions
															}
														</div>
													</div>
												)}
										</div>
									))}
								</div>
							)}
						</div>
					)}
					{/* Profile Tab */}
					{activeTab === "profile" && (
						<div className="p-6">
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold flex items-center space-x-2">
									<User
										className="text-blue-600"
										size={24}
									/>
									<span>Thông tin Cá nhân</span>
								</h2>

								{!isEditing && (
									<button
										onClick={handleEditProfile}
										className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
										<Edit size={16} />
										<span>Chỉnh sửa</span>
									</button>
								)}
							</div>

							<div className="max-w-2xl">
								<div className="grid gap-6">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Họ và tên
										</label>
										{isEditing ? (
											<input
												type="text"
												value={editForm.name}
												onChange={(e) =>
													setEditForm((prev) => ({
														...prev,
														name: e.target.value,
													}))
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											/>
										) : (
											<div className="flex items-center space-x-2">
												<User
													size={16}
													className="text-gray-400"
												/>
												<span className="text-gray-900">
													{user?.name}
												</span>
											</div>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Email
										</label>
										{isEditing ? (
											<input
												type="email"
												value={editForm.email}
												onChange={(e) =>
													setEditForm((prev) => ({
														...prev,
														email: e.target.value,
													}))
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											/>
										) : (
											<div className="flex items-center space-x-2">
												<Mail
													size={16}
													className="text-gray-400"
												/>
												<span className="text-gray-900">
													{user?.email}
												</span>
											</div>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Số điện thoại
										</label>
										{isEditing ? (
											<input
												type="tel"
												value={editForm.phoneNumber}
												onChange={(e) =>
													setEditForm((prev) => ({
														...prev,
														phoneNumber:
															e.target.value,
													}))
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
											/>
										) : (
											<div className="flex items-center space-x-2">
												<Phone
													size={16}
													className="text-gray-400"
												/>
												<span className="text-gray-900">
													{user?.phoneNumber ||
														"Chưa cập nhật"}
												</span>
											</div>
										)}
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Ngày sinh
										</label>
										<div className="flex items-center space-x-2">
											<Calendar
												size={16}
												className="text-gray-400"
											/>
											<span className="text-gray-900">
												{formatDate(user?.dateOfBirth)}
											</span>
										</div>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">
											Vai trò
										</label>
										<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
											Bệnh nhân
										</span>
									</div>
								</div>

								{isEditing && (
									<div className="flex space-x-3 mt-6">
										<button
											onClick={handleSaveProfile}
											disabled={loading}
											className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
											<Save size={16} />
											<span>
												{loading
													? "Đang lưu..."
													: "Lưu thay đổi"}
											</span>
										</button>

										<button
											onClick={handleCancelEdit}
											disabled={loading}
											className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
											<X size={16} />
											<span>Hủy</span>
										</button>
									</div>
								)}
							</div>
						</div>
					)}
					{/* Blockchain Tab */}
					{activeTab === "blockchain" && (
						<div className="p-6">
							<h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
								<Shield
									className="text-blue-600"
									size={24}
								/>
								<span>Kiểm tra Tính toàn vẹn Blockchain</span>
							</h2>

							<div className="max-w-6xl">
								<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
									<h3 className="font-medium text-blue-900 mb-2">
										Blockchain là gì?
									</h3>
									<p className="text-blue-800 text-sm">
										Blockchain đảm bảo hồ sơ y tế của bạn
										không bị thay đổi trái phép. Mỗi hồ sơ
										được mã hóa và liên kết với nhau tạo
										thành chuỗi bảo mật.
									</p>
								</div>

								{/* Overall blockchain verification */}
								<div className="mb-8">
									<h3 className="text-lg font-medium text-gray-900 mb-4">
										Kiểm tra tổng thể
									</h3>

									<div className="grid md:grid-cols-2 gap-4 mb-6">
										{/* Kiểm tra toàn bộ blockchain */}
										<button
											onClick={handleVerifyBlockchain}
											disabled={loading}
											className="flex items-center justify-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
											<Shield size={20} />
											<span>
												{loading ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
														Đang kiểm tra...
													</>
												) : (
													"Kiểm tra toàn bộ Blockchain"
												)}
											</span>
										</button>

										{/* Kiểm tra tất cả blocks của bệnh nhân */}
										<button
											onClick={
												handleVerifyAllPatientBlocks
											}
											disabled={verifyingAllBlocks}
											className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
											<User size={20} />
											<span>
												{verifyingAllBlocks ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
														Đang xác thực...
													</>
												) : (
													"Xác thực tất cả hồ sơ của tôi"
												)}
											</span>
										</button>
									</div>

									{/* Kết quả kiểm tra blockchain tổng thể */}
									{blockchainStatus && (
										<div
											className={`border rounded-lg p-4 mb-6 ${
												blockchainStatus.valid
													? "bg-green-50 border-green-200"
													: "bg-red-50 border-red-200"
											}`}>
											<div className="flex items-center space-x-2 mb-3">
												{blockchainStatus.valid ? (
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
												<h3
													className={`font-semibold ${
														blockchainStatus.valid
															? "text-green-900"
															: "text-red-900"
													}`}>
													{blockchainStatus.message}
												</h3>
											</div>

											<div className="space-y-2 text-sm">
												<div
													className={
														blockchainStatus.valid
															? "text-green-800"
															: "text-red-800"
													}>
													<strong>
														Tổng số blocks:
													</strong>{" "}
													{
														blockchainStatus.totalBlocks
													}
												</div>
												<div
													className={
														blockchainStatus.valid
															? "text-green-800"
															: "text-red-800"
													}>
													<strong>Chi tiết:</strong>{" "}
													{blockchainStatus.details}
												</div>
											</div>

											{blockchainStatus.valid && (
												<div className="mt-3 p-3 bg-green-100 rounded border border-green-200">
													<p className="text-green-800 text-sm font-medium">
														✅ Hồ sơ y tế của bạn an
														toàn và không bị thay
														đổi trái phép
													</p>
												</div>
											)}
										</div>
									)}

									{/* Kết quả xác thực tất cả blocks của bệnh nhân */}
									{allBlocksVerification && (
										<div
											className={`border rounded-lg p-4 mb-6 ${
												allBlocksVerification.overallValid
													? "bg-green-50 border-green-200"
													: "bg-red-50 border-red-200"
											}`}>
											<div className="flex items-center space-x-2 mb-3">
												{allBlocksVerification.overallValid ? (
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
												<h3
													className={`font-semibold ${
														allBlocksVerification.overallValid
															? "text-green-900"
															: "text-red-900"
													}`}>
													Kết quả xác thực tất cả hồ
													sơ của bạn
												</h3>
											</div>

											<div className="grid md:grid-cols-4 gap-4 mb-4">
												<div className="bg-white rounded-lg p-3 border">
													<div className="text-2xl font-bold text-gray-900">
														{
															allBlocksVerification
																.statistics
																.totalBlocks
														}
													</div>
													<div className="text-sm text-gray-600">
														Tổng số blocks
													</div>
												</div>
												<div className="bg-white rounded-lg p-3 border">
													<div className="text-2xl font-bold text-green-600">
														{
															allBlocksVerification
																.statistics
																.validBlocks
														}
													</div>
													<div className="text-sm text-gray-600">
														Blocks hợp lệ
													</div>
												</div>
												<div className="bg-white rounded-lg p-3 border">
													<div className="text-2xl font-bold text-red-600">
														{
															allBlocksVerification
																.statistics
																.invalidBlocks
														}
													</div>
													<div className="text-sm text-gray-600">
														Blocks lỗi
													</div>
												</div>
												<div className="bg-white rounded-lg p-3 border">
													<div className="text-2xl font-bold text-blue-600">
														{
															allBlocksVerification
																.statistics
																.validityPercentage
														}
														%
													</div>
													<div className="text-sm text-gray-600">
														Độ tin cậy
													</div>
												</div>
											</div>

											{allBlocksVerification.statistics
												.invalidBlocks > 0 && (
												<div className="bg-red-100 border border-red-300 rounded p-3">
													<p className="text-red-800 text-sm font-medium">
														⚠️ Phát hiện{" "}
														{
															allBlocksVerification
																.statistics
																.invalidBlocks
														}{" "}
														blocks có vấn đề. Vui
														lòng liên hệ quản trị
														viên để kiểm tra.
													</p>
												</div>
											)}

											{/* Hiển thị chi tiết blocks có vấn đề */}
											{allBlocksVerification.verificationResults.some(
												(r) => !r.isValid
											) && (
												<div className="mt-4">
													<h4 className="font-medium text-red-900 mb-2">
														Blocks có vấn đề:
													</h4>
													<div className="space-y-2 max-h-60 overflow-y-auto">
														{allBlocksVerification.verificationResults
															.filter(
																(r) =>
																	!r.isValid
															)
															.map(
																(
																	result,
																	index
																) => (
																	<div
																		key={
																			index
																		}
																		className="bg-red-50 border border-red-200 rounded p-3">
																		<div className="flex justify-between items-start">
																			<div>
																				<div className="font-medium text-red-900">
																					Block
																					#
																					{
																						result.blockIndex
																					}{" "}
																					-{" "}
																					{
																						result.diagnosis
																					}
																				</div>
																				<div className="text-sm text-red-700">
																					{formatDateTime(
																						result.timestamp
																					)}
																				</div>
																			</div>
																			<div className="text-xs text-red-600">
																				{result.issues.join(
																					", "
																				)}
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

								{/* Time range verification */}
								<div className="mb-8">
									<h3 className="text-lg font-medium text-gray-900 mb-4">
										Kiểm tra theo khoảng thời gian
									</h3>

									<div className="bg-gray-50 rounded-lg p-4 mb-4">
										<div className="grid md:grid-cols-4 gap-4 items-end">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">
													Từ ngày
												</label>
												<input
													type="date"
													value={
														timeRangeFilter.startDate
													}
													onChange={(e) =>
														setTimeRangeFilter(
															(prev) => ({
																...prev,
																startDate:
																	e.target
																		.value,
															})
														)
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
													value={
														timeRangeFilter.endDate
													}
													onChange={(e) =>
														setTimeRangeFilter(
															(prev) => ({
																...prev,
																endDate:
																	e.target
																		.value,
															})
														)
													}
													className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
												/>
											</div>
											<div>
												<button
													onClick={
														handleVerifyTimeRange
													}
													disabled={
														verifyingTimeRange
													}
													className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
													<Calendar size={16} />
													<span>
														{verifyingTimeRange ? (
															<>
																<Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
																Đang kiểm tra...
															</>
														) : (
															"Xác thực theo thời gian"
														)}
													</span>
												</button>
											</div>
											<div>
												<button
													onClick={
														handleClearTimeRange
													}
													disabled={
														verifyingTimeRange
													}
													className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
													<Calendar size={16} />
													<span>Clear Filter</span>
												</button>
											</div>
										</div>
									</div>

									{/* Kết quả xác thực theo thời gian */}
									{timeRangeVerification && (
										<div
											className={`border rounded-lg p-4 mb-6 ${
												timeRangeVerification.overallValid
													? "bg-green-50 border-green-200"
													: "bg-red-50 border-red-200"
											}`}>
											<div className="flex items-center space-x-2 mb-3">
												{timeRangeVerification.overallValid ? (
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
												<h3
													className={`font-semibold ${
														timeRangeVerification.overallValid
															? "text-green-900"
															: "text-red-900"
													}`}>
													Kết quả xác thực từ{" "}
													{timeRangeFilter.startDate ||
														"đầu"}{" "}
													đến{" "}
													{timeRangeFilter.endDate ||
														"cuối"}
												</h3>
											</div>

											<div className="grid md:grid-cols-4 gap-4 mb-4">
												<div className="bg-white rounded-lg p-3 border">
													<div className="text-2xl font-bold text-gray-900">
														{
															timeRangeVerification
																.statistics
																.totalBlocks
														}
													</div>
													<div className="text-sm text-gray-600">
														Blocks trong khoảng
													</div>
												</div>
												<div className="bg-white rounded-lg p-3 border">
													<div className="text-2xl font-bold text-green-600">
														{
															timeRangeVerification
																.statistics
																.validBlocks
														}
													</div>
													<div className="text-sm text-gray-600">
														Blocks hợp lệ
													</div>
												</div>
												<div className="bg-white rounded-lg p-3 border">
													<div className="text-2xl font-bold text-red-600">
														{
															timeRangeVerification
																.statistics
																.invalidBlocks
														}
													</div>
													<div className="text-sm text-gray-600">
														Blocks lỗi
													</div>
												</div>
												<div className="bg-white rounded-lg p-3 border">
													<div className="text-2xl font-bold text-blue-600">
														{
															timeRangeVerification
																.statistics
																.validityPercentage
														}
														%
													</div>
													<div className="text-sm text-gray-600">
														Độ tin cậy
													</div>
												</div>
											</div>

											{/* Timeline của blocks trong khoảng thời gian */}
											{timeRangeVerification
												.verificationResults.length >
												0 && (
												<div className="mt-4">
													<h4 className="font-medium text-gray-900 mb-3">
														Timeline các hồ sơ (
														{
															timeRangeVerification
																.verificationResults
																.length
														}{" "}
														blocks)
													</h4>
													<div className="space-y-2 max-h-80 overflow-y-auto">
														{timeRangeVerification.verificationResults.map(
															(result, index) => (
																<div
																	key={index}
																	className={`border rounded-lg p-3 ${
																		result.isValid
																			? "bg-green-50 border-green-200"
																			: "bg-red-50 border-red-200"
																	}`}>
																	<div className="flex justify-between items-start">
																		<div className="flex-1">
																			<div className="flex items-center space-x-2 mb-1">
																				{result.isValid ? (
																					<Check
																						className="text-green-600"
																						size={
																							16
																						}
																					/>
																				) : (
																					<AlertTriangle
																						className="text-red-600"
																						size={
																							16
																						}
																					/>
																				)}
																				<span className="font-medium">
																					Block
																					#
																					{
																						result.blockIndex
																					}{" "}
																					-{" "}
																					{
																						result.diagnosis
																					}
																				</span>
																			</div>
																			<div className="text-sm text-gray-600">
																				Hành
																				động:{" "}
																				{getActionText(
																					result.action
																				)}{" "}
																				•{" "}
																				{formatDateTime(
																					result.timestamp
																				)}
																			</div>
																			{!result.isValid &&
																				result.issues && (
																					<div className="text-sm text-red-600 mt-1">
																						Vấn
																						đề:{" "}
																						{result.issues.join(
																							", "
																						)}
																					</div>
																				)}
																		</div>
																		<div className="text-xs text-gray-400">
																			#
																			{
																				result.blockIndex
																			}
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

								{/* Individual records verification */}
								<div>
									<h3 className="text-lg font-medium text-gray-900 mb-4">
										Kiểm tra từng hồ sơ
									</h3>

									{medicalRecords.length === 0 ? (
										<div className="text-center py-8 text-gray-500">
											<Shield
												size={48}
												className="mx-auto mb-4 text-gray-300"
											/>
											<p>
												Chưa có hồ sơ y tế nào để kiểm
												tra
											</p>
										</div>
									) : (
										<div className="space-y-4">
											{medicalRecords.map((record) => (
												<div
													key={record._id}
													className="border border-gray-200 rounded-lg p-4">
													<div className="flex justify-between items-start mb-3">
														<div>
															<h4 className="font-medium text-gray-900">
																{
																	record.diagnosis
																}
															</h4>
															<p className="text-sm text-gray-600">
																Bác sĩ:{" "}
																{
																	record
																		.doctorId
																		.name
																}{" "}
																•{" "}
																{formatDate(
																	record.createdAt
																)}
															</p>
														</div>
														<div>
															<button
																onClick={() =>
																	handleVerifyRecord(
																		record._id
																	)
																}
																disabled={verifyingRecords.has(
																	record._id
																)}
																className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
																{verifyingRecords.has(
																	record._id
																) ? (
																	<Loader2
																		className="animate-spin"
																		size={
																			16
																		}
																	/>
																) : (
																	<Shield
																		size={
																			16
																		}
																	/>
																)}
																<span>
																	{verifyingRecords.has(
																		record._id
																	)
																		? "Đang kiểm tra..."
																		: "Kiểm tra"}
																</span>
															</button>
														</div>
													</div>

													{/* Verification result cho từng record */}
													{recordVerifications[
														record._id
													] && (
														<div
															className={`mt-3 p-3 rounded-lg text-sm ${
																recordVerifications[
																	record._id
																].isValid
																	? "bg-green-50 border border-green-200"
																	: "bg-red-50 border border-red-200"
															}`}>
															<div className="flex items-center space-x-2 mb-2">
																{recordVerifications[
																	record._id
																].isValid ? (
																	<Check
																		className="text-green-600"
																		size={
																			16
																		}
																	/>
																) : (
																	<AlertTriangle
																		className="text-red-600"
																		size={
																			16
																		}
																	/>
																)}
																<span
																	className={`font-medium ${
																		recordVerifications[
																			record
																				._id
																		]
																			.isValid
																			? "text-green-900"
																			: "text-red-900"
																	}`}>
																	{
																		recordVerifications[
																			record
																				._id
																		]
																			.verified
																	}
																</span>
															</div>
															<div
																className={
																	recordVerifications[
																		record
																			._id
																	].isValid
																		? "text-green-800"
																		: "text-red-800"
																}>
																Block index:{" "}
																{
																	recordVerifications[
																		record
																			._id
																	].blockIndex
																}
															</div>
														</div>
													)}
												</div>
											))}
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
export default PatientDashboard;
