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
	Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import {
	apiGetRecordHistory,
	apiGetUserMedicalRecords,
	apiVerifyRecord,
} from "../../apis/record";
import { apiUpdateUser } from "../../apis/user";
import useAuth from "../../hooks/useAuth";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import TabButton from "../patient/TabButton";
import BlockchainTab from "./BlockchainTab";

const PatientDashboard = () => {
	const { user, updateUser } = useAuth();
	const location = useLocation();
	const [activeTab, setActiveTab] = useState("medical-records");

	const [medicalRecords, setMedicalRecords] = useState([]);

	const [isEditing, setIsEditing] = useState(false);
	const [editForm, setEditForm] = useState({});
	const [loading, setLoading] = useState(false);

	// New states for individual record verification
	const [expandedRecord, setExpandedRecord] = useState(null);
	const [recordVerifications, setRecordVerifications] = useState({});
	const [recordHistories, setRecordHistories] = useState({});
	const [verifyingRecords, setVerifyingRecords] = useState(new Set());
	console.log(medicalRecords)

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
		// Setup editForm when user is available
		if (user) {
			const formData = {
				name: user.name,
				phoneNumber: user.phoneNumber || "",
			};

			// Only include email for traditional auth users
			if (user.authMethod === "traditional") {
				formData.email = user.email;
			}

			setEditForm(formData);
		}
	}, [user]);

	useEffect(() => {
		const { activeTab } = location.state || {};
		if (activeTab) {
			setActiveTab(activeTab);
		}
	}, [location.state]);

	// Redirect if not authenticated or wrong role
	if (!user) {
		return (
			<Navigate
				to="/login"
				replace
			/>
		);
	} else if (user.role === "doctor") {
		return (
			<Navigate
				to="/doctors"
				replace
			/>
		);
	} else if (user.role === "admin") {
		return (
			<Navigate
				to="/admin"
				replace
			/>
		);
	}

	const handleEditProfile = () => {
		setIsEditing(true);
	};

	const handleCancelEdit = () => {
		setIsEditing(false);
		const formData = {
			name: user?.name,
			phoneNumber: user?.phoneNumber || "",
		};

		if (user?.authMethod === "traditional") {
			formData.email = user?.email;
		}

		setEditForm(formData);
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

	// Functions for individual record verification
	const handleVerifyRecord = (recordId) => {
		setVerifyingRecords((prev) => new Set([...prev, recordId]));

		setTimeout(async () => {
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
		}, 1500);
	};

	const handleViewHistory = async (recordId) => {
		if (recordHistories[recordId]) {
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

	const getStatusText = (status) => {
		switch (status) {
			case "completed":
				return "Đã hoàn thành";
			case "ongoing":
				return "Đang theo dõi";
			default:
				return "Trạng thái không xác định";
		}
	};

	const getAuthMethodDisplay = (authMethod) => {
		switch (authMethod) {
			case "traditional":
				return "Email/Mật khẩu";
			case "wallet":
				return "Ví điện tử";
			default:
				return "Không xác định";
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 p-4">
			<div className="max-w-6xl mx-auto">
				{/* Header */}
				<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
					<div className="flex items-center justify-between">
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
						
						{/* Authentication method indicator */}
						<div className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full">
							{user?.authMethod === "wallet" ? (
								<Wallet className="text-purple-600" size={16} />
							) : (
								<Mail className="text-blue-600" size={16} />
							)}
							<span className="text-sm text-gray-700">
								{getAuthMethodDisplay(user?.authMethod)}
							</span>
						</div>
					</div>
				</div>

				{/* Navigation Tabs */}
				<div className="flex space-x-2 mb-6">
					<TabButton
						id="medical-records"
						icon={FileText}
						activeTab={activeTab}
						setActiveTab={setActiveTab}>
						Hồ sơ Y tế
					</TabButton>
					<TabButton
						id="profile"
						icon={User}
						activeTab={activeTab}
						setActiveTab={setActiveTab}>
						Thông tin Cá nhân
					</TabButton>
					<TabButton
						id="blockchain"
						icon={Shield}
						activeTab={activeTab}
						setActiveTab={setActiveTab}>
						Kiểm tra Blockchain
					</TabButton>
				</div>

				{/* Content */}
				<div className="bg-white rounded-lg shadow-sm">
					{/* Medical Records Tab */}
					{activeTab === "medical-records" && (
						<div className="p-6">
							<h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
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
														<h3 className="font-semibold text-xl text-gray-900 mb-2">
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
															<div>
																<span className="font-medium text-gray-700">
																	Trạng thái
																	hồ sơ:
																</span>
																<span className="ml-2 text-gray-600">
																	{getStatusText(
																		record.status
																	)}
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
															className="flex items-center space-x-2 px-3 py-1 cursor-pointer bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors disabled:opacity-50 text-sm">
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
															className="flex items-center space-x-2 px-3 py-1 cursor-pointer bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
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
													<div className="border-t border-gray-100 p-4 bg-gray-100">
														<h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
															<History
																size={16}
															/>
															<span>
																Lịch sử giao
																dịch
															</span>
														</h4>
														<div className="space-y-2">
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
																					<div className="text-sm text-gray-700 mb-1">
																						Cập
																						nhật
																						bởi{" "}
																						{
																							transaction
																								.updatedBy
																								.name
																						}
																						{` (${transaction.updatedBy.email || transaction.updatedBy.walletAddress})`}
																					</div>
																				)}
																				<div className="text-sm text-gray-700">
																					{formatDateTime(
																						transaction.timestamp
																					)}
																				</div>
																				<div className="text-sm text-gray-700 mt-1">
																					Block
																					#
																					{
																						transaction.blockIndex
																					}
																				</div>
																				<div className="text-sm text-gray-700 mt-1">
																					Block
																					hash:{" "}
																					{
																						transaction.hash
																					}
																				</div>
																			</div>
																		</div>
																	</div>
																)
															)}
														</div>
														<div className="mt-3 text-gray-800 font-semibold">
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
								<h2 className="text-2xl font-bold flex items-center space-x-2">
									<User
										className="text-blue-600"
										size={24}
									/>
									<span>Thông tin Cá nhân</span>
								</h2>

								{!isEditing && (
									<button
										onClick={handleEditProfile}
										className="flex items-center space-x-2 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
										<Edit size={16} />
										<span>Chỉnh sửa</span>
									</button>
								)}
							</div>

							<div className="max-w-2xl">
								<div className="grid gap-6">
									{/* Name */}
									<div>
										<label className="block text-lg font-medium text-gray-700 mb-2">
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

									{/* Email (only for traditional auth) */}
									{user?.authMethod === "traditional" && (
										<div>
											<label className="block text-lg font-medium text-gray-700 mb-2">
												Email
											</label>
											{isEditing ? (
												<input
													type="email"
													value={editForm.email || ""}
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
									)}

									{/* Wallet Address (only for wallet auth) */}
									{user?.authMethod === "wallet" && (
										<div>
											<label className="block text-lg font-medium text-gray-700 mb-2">
												Địa chỉ ví
											</label>
											<div className="flex items-center space-x-2">
												<Wallet
													size={16}
													className="text-gray-400"
												/>
												<span className="text-gray-900 font-mono text-sm break-all">
													{user?.walletAddress}
												</span>
												{user?.isWalletVerified && (
													<span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
														<Check size={12} className="mr-1" />
														Đã xác minh
													</span>
												)}
											</div>
										</div>
									)}

									{/* Phone Number */}
									<div>
										<label className="block text-lg font-medium text-gray-700 mb-2">
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

									{/* Date of Birth */}
									{user?.dateOfBirth && (
										<div>
											<label className="block text-lg font-medium text-gray-700 mb-2">
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
									)}

									{/* Role */}
									<div>
										<label className="block text-lg font-medium text-gray-700 mb-2">
											Vai trò
										</label>
										<span className="inline-flex items-center px-3 py-1 rounded-full text-lg font-medium bg-green-100 text-green-800">
											Bệnh nhân
										</span>
									</div>

									{/* Authentication Method */}
									<div>
										<label className="block text-lg font-medium text-gray-700 mb-2">
											Phương thức xác thực
										</label>
										<div className="flex items-center space-x-2">
											{user?.authMethod === "wallet" ? (
												<Wallet
													size={16}
													className="text-purple-600"
												/>
											) : (
												<Mail
													size={16}
													className="text-blue-600"
												/>
											)}
											<span className="text-gray-900">
												{getAuthMethodDisplay(user?.authMethod)}
											</span>
										</div>
									</div>

									{/* Account Created Date */}
									<div>
										<label className="block text-lg font-medium text-gray-700 mb-2">
											Ngày tạo tài khoản
										</label>
										<div className="flex items-center space-x-2">
											<Calendar
												size={16}
												className="text-gray-400"
											/>
											<span className="text-gray-900">
												{formatDateTime(user?.createdAt)}
											</span>
										</div>
									</div>
								</div>

								{isEditing && (
									<div className="flex space-x-3 mt-6">
										<button
											onClick={handleSaveProfile}
											disabled={loading}
											className="flex items-center space-x-2 px-4 py-2 cursor-pointer bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
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
											className="flex items-center space-x-2 px-4 py-2 cursor-pointer border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
											<X size={16} />
											<span>Hủy</span>
										</button>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Blockchain Tab */}
					{activeTab === "blockchain" && <BlockchainTab medicalRecords={medicalRecords} />}
				</div>
			</div>
		</div>
	);
};

export default PatientDashboard;