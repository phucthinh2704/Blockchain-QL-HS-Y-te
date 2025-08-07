import {
	Activity,
	AlertTriangle,
	CheckCircle,
	Database,
	Eye,
	FileText,
	PenBox,
	RefreshCw,
	Search,
	Shield,
	Trash2,
	TrendingUp,
	UserCheck,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { apiGetBlockchainInformation } from "../../apis/blockchain";
import { apiGetAllMedicalRecords } from "../../apis/record";
import { apiGetAllUsers } from "../../apis/user";
import BlockchainView from "./BlockchainView";
import UserModal from "./UserModal";
import MedicalRecordModal from "../doctor/MedicalRecordModal";
import UnauthorizedAccess from "../common/UnauthorizedAccess";
import useAuth from "../../hooks/useAuth";
import EditUserModal from "./EditUserModal";

// Statistics cards component
const StatsCard = ({
	title,
	value,
	icon: Icon,
	color = "blue",
	trend = null,
}) => (
	<div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-blue-500">
		<div className="flex items-center justify-between">
			<div>
				<p className="text-sm font-medium text-gray-600">{title}</p>
				<p className="text-2xl font-bold text-gray-900">{value}</p>
				{trend && (
					<p className="text-sm text-green-600 flex items-center mt-1">
						<TrendingUp className="w-4 h-4 mr-1" />
						{trend}
					</p>
				)}
			</div>
			<Icon className={`w-8 h-8 text-${color}-500`} />
		</div>
	</div>
);

// Dashboard view component
const DashboardView = ({
	users,
	medicalRecords,
	blockchainInfo,
	loading,
	onLoadData,
	onVerifyBlockchain,
}) => (
	<div className="space-y-6">
		<div className="flex justify-between items-center">
			<h2 className="text-2xl font-bold text-gray-900">
				Tổng quan hệ thống
			</h2>
			<button
				onClick={onLoadData}
				disabled={loading}
				className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
				<RefreshCw
					className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
				/>
				Làm mới
			</button>
		</div>

		{/* Statistics */}
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			<StatsCard
				title="Tổng người dùng"
				value={users.length}
				icon={Users}
				color="blue"
			/>
			<StatsCard
				title="Hồ sơ y tế"
				value={medicalRecords.length}
				icon={FileText}
				color="green"
			/>
			<StatsCard
				title="Blocks trong chuỗi"
				value={blockchainInfo?.totalBlocks || 0}
				icon={Database}
				color="purple"
			/>
			<StatsCard
				title="Tính toàn vẹn"
				value={`${blockchainInfo?.integrityPercentage || 0}%`}
				icon={blockchainInfo?.chainValid ? CheckCircle : AlertTriangle}
				color={blockchainInfo?.chainValid ? "green" : "red"}
			/>
		</div>

		{/* Blockchain Status */}
		<div className="bg-white p-6 rounded-lg shadow-md">
			<div className="flex justify-between items-center mb-4">
				<h3 className="text-lg font-semibold text-gray-900">
					Trạng thái Blockchain
				</h3>
				<button
					onClick={onVerifyBlockchain}
					disabled={loading}
					className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
					<Shield className="w-4 h-4 mr-2" />
					Xác thực
				</button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div className="text-center p-4 bg-gray-50 rounded-lg">
					<p className="text-sm text-gray-600">Trạng thái mạng</p>
					<p
						className={`font-semibold ${
							blockchainInfo?.networkStatus === "healthy"
								? "text-green-600"
								: "text-red-600"
						}`}>
						{blockchainInfo?.networkStatus === "healthy"
							? "Khỏe mạnh"
							: "Có vấn đề"}
					</p>
				</div>
				<div className="text-center p-4 bg-gray-50 rounded-lg">
					<p className="text-sm text-gray-600">Blocks hợp lệ</p>
					<p className="font-semibold text-blue-600">
						{blockchainInfo?.validBlocks}/
						{blockchainInfo?.totalBlocks}
					</p>
				</div>
				<div className="text-center p-4 bg-gray-50 rounded-lg">
					<p className="text-sm text-gray-600">Block cuối</p>
					<p className="font-semibold text-gray-800">
						{blockchainInfo?.lastBlockTime
							? new Date(
									blockchainInfo.lastBlockTime
							  ).toLocaleDateString("vi-VN")
							: "N/A"}
					</p>
				</div>
			</div>
		</div>

		{/* Recent Activity */}
		<div className="bg-white p-6 rounded-lg shadow-md">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">
				Hoạt động gần đây
			</h3>
			<div className="space-y-3">
				{medicalRecords.slice(0, 5).map((record) => (
					<div
						key={record._id}
						className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div className="flex items-center">
							<FileText className="w-5 h-5 text-blue-500 mr-3" />
							<div>
								<p className="font-medium">
									{record.diagnosis}
								</p>
								<p className="text-sm text-gray-600">
									Bệnh nhân: {record.patientId.name} | BS:{" "}
									{record.doctorId.name}
								</p>
							</div>
						</div>
						<span
							className={`px-2 py-1 rounded-full text-xs font-medium ${
								record.status === "completed"
									? "bg-green-100 text-green-800"
									: "bg-yellow-100 text-yellow-800"
							}`}>
							{record.status === "completed"
								? "Đã hoàn thành"
								: "Đang theo dõi"}
						</span>
					</div>
				))}
			</div>
		</div>
	</div>
);

// Users management view component
const UsersView = ({ users, searchTerm, onSearchChange }) => {
	const [selectedUser, setSelectedUser] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	const filteredUsers = users.filter(
		(user) =>
			user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.walletAddress?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const getRoleBadge = (role) => {
		const colors = {
			admin: "bg-red-100 text-red-800",
			doctor: "bg-blue-100 text-blue-800",
			patient: "bg-green-100 text-green-800",
		};
		const labels = {
			admin: "Quản trị",
			doctor: "Bác sĩ",
			patient: "Bệnh nhân",
		};
		return (
			<span
				className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role]}`}>
				{labels[role]}
			</span>
		);
	};

	const handleViewUser = (user) => {
		setSelectedUser(user);
		setIsModalOpen(true);
	};

	const handleEditUser = (user) => {
		setSelectedUser(user);
		setIsEditModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedUser(null);
	};
	const handleSaveUser = (updatedUser) => {
		console.log(updatedUser);
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-900">
					Quản lý người dùng
				</h2>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
				<input
					type="text"
					placeholder="Tìm kiếm người dùng..."
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			{/* Users table */}
			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Người dùng
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Vai trò
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Ngày tạo
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Hành động
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredUsers.map((user) => (
							<tr
								key={user._id}
								className="hover:bg-gray-50">
								<td className="px-6 py-4 whitespace-nowrap">
									<div>
										<div className="font-medium text-gray-900">
											{user.name}
										</div>
										<div className="text-sm text-gray-500">
											{user.walletAddress ||
												"0xa1b2c3d4e5f60718293a4b5c6d7e8f901234abcd"}
										</div>
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									{getRoleBadge(user.role)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{new Date(
										user.createdAt
									).toLocaleDateString("vi-VN")}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<button
										onClick={() => handleViewUser(user)}
										className="text-blue-600 hover:text-blue-900 mr-3 transition-colors"
										title="Xem thông tin chi tiết">
										<Eye className="w-4 h-4" />
									</button>
									<button
										onClick={() => handleEditUser(user)}
										className="text-green-600 hover:text-green-900 mr-3 transition-colors"
										title="Chỉnh sửa người dùng">
										<PenBox className="w-4 h-4" />
									</button>
									<button
										className="text-red-600 hover:text-red-900 transition-colors"
										title="Xóa người dùng">
										<Trash2 className="w-4 h-4" />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* Empty state */}
				{filteredUsers.length === 0 && (
					<div className="text-center py-12">
						<div className="text-gray-500 text-lg">
							Không tìm thấy người dùng nào
						</div>
						<div className="text-gray-400 text-sm mt-1">
							Thử thay đổi từ khóa tìm kiếm
						</div>
					</div>
				)}
			</div>

			{/* User Modal */}
			<UserModal
				user={selectedUser}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
			/>

			<EditUserModal
				user={selectedUser}
				isOpen={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				onSave={handleSaveUser}
			/>
		</div>
	);
};

// Medical Records view component
const MedicalRecordsView = ({
	medicalRecords,
	searchTerm,
	onSearchChange,
	onVerifyBlockchain,
}) => {
	const [selectedRecord, setSelectedRecord] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const filteredRecords = medicalRecords.filter(
		(record) =>
			record.diagnosis
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.patientId?.name
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.patientId?.email
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.doctorId?.name
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.doctorId?.email
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.treatment
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.medication?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleViewRecord = (record) => {
		setSelectedRecord(record);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedRecord(null);
	};

	const handleVerifyRecord = (record) => {
		// Logic xác thực record cụ thể
		console.log("Verifying record:", record._id);
		// Có thể gọi API xác thực riêng cho record này
	};

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-2xl font-bold text-gray-900">Hồ sơ y tế</h2>
				<div className="flex space-x-2">
					<button
						onClick={onVerifyBlockchain}
						className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
						<Shield className="w-4 h-4 mr-2" />
						Xác thực toàn bộ
					</button>
				</div>
			</div>

			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
				<input
					type="text"
					placeholder="Tìm kiếm hồ sơ theo chẩn đoán, bệnh nhân, bác sĩ..."
					value={searchTerm}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
				/>
			</div>

			{/* Records table */}
			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Chẩn đoán
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Bệnh nhân
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Bác sĩ
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Trạng thái
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Blockchain
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Hành động
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{filteredRecords.map((record) => (
							<tr
								key={record._id}
								className="hover:bg-gray-50 transition-colors">
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="font-medium text-gray-900">
										{record.diagnosis}
									</div>
									<div className="text-sm text-gray-500">
										{new Date(
											record.createdAt
										).toLocaleDateString("vi-VN")}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">
										{record.patientId?.name ||
											"Chưa có tên"}
									</div>
									<div className="text-sm text-gray-500">
										{record.patientId?.email ||
											"Chưa có email"}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="text-sm text-gray-900">
										{record.doctorId?.name || "Chưa có tên"}
									</div>
									<div className="text-sm text-gray-500">
										{record.doctorId?.email ||
											"Chưa có email"}
									</div>
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`px-2 py-1 rounded-full text-xs font-medium ${
											record.status === "completed"
												? "bg-green-100 text-green-800"
												: "bg-yellow-100 text-yellow-800"
										}`}>
										{record.status === "completed"
											? "Đã hoàn thành"
											: "Đang theo dõi"}
									</span>
									{/* Follow-up indicator */}
									{record.dateBack &&
										new Date(record.dateBack) >
											new Date() && (
											<div className="mt-1">
												<span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
													Tái khám:{" "}
													{new Date(
														record.dateBack
													).toLocaleDateString(
														"vi-VN"
													)}
												</span>
											</div>
										)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<div className="flex items-center">
										<CheckCircle className="w-4 h-4 text-green-500 mr-2" />
										<span className="text-xs text-gray-500 font-mono">
											{record.blockchainHash
												? `${record.blockchainHash.substring(
														0,
														8
												  )}...`
												: "Chưa có"}
										</span>
									</div>
									{record.blockIndex !== undefined && (
										<div className="text-xs text-gray-400 mt-1">
											Block #{record.blockIndex}
										</div>
									)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
									<div className="flex items-center space-x-2">
										<button
											onClick={() =>
												handleViewRecord(record)
											}
											className="text-blue-600 hover:text-blue-900 transition-colors"
											title="Xem chi tiết hồ sơ">
											<Eye className="w-4 h-4" />
										</button>
										<button
											onClick={() =>
												handleVerifyRecord(record)
											}
											className="text-green-600 hover:text-green-900 transition-colors"
											title="Xác thực blockchain">
											<Shield className="w-4 h-4" />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>

				{/* Empty state */}
				{filteredRecords.length === 0 && (
					<div className="text-center py-12">
						<div className="text-gray-500 text-lg">
							Không tìm thấy hồ sơ y tế nào
						</div>
						<div className="text-gray-400 text-sm mt-1">
							{searchTerm
								? "Thử thay đổi từ khóa tìm kiếm"
								: "Chưa có hồ sơ y tế nào được tạo"}
						</div>
					</div>
				)}
			</div>

			{/* Summary Stats */}
			{medicalRecords.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="bg-white p-4 rounded-lg shadow-sm border">
						<div className="text-2xl font-bold text-blue-600">
							{medicalRecords.length}
						</div>
						<div className="text-sm text-gray-500">Tổng hồ sơ</div>
					</div>
					<div className="bg-white p-4 rounded-lg shadow-sm border">
						<div className="text-2xl font-bold text-green-600">
							{
								medicalRecords.filter(
									(r) => r.status === "completed"
								).length
							}
						</div>
						<div className="text-sm text-gray-500">
							Đã hoàn thành
						</div>
					</div>
					<div className="bg-white p-4 rounded-lg shadow-sm border">
						<div className="text-2xl font-bold text-yellow-600">
							{
								medicalRecords.filter(
									(r) => r.status === "ongoing"
								).length
							}
						</div>
						<div className="text-sm text-gray-500">
							Đang theo dõi
						</div>
					</div>
					<div className="bg-white p-4 rounded-lg shadow-sm border">
						<div className="text-2xl font-bold text-purple-600">
							{
								medicalRecords.filter(
									(r) =>
										r.dateBack &&
										new Date(r.dateBack) > new Date()
								).length
							}
						</div>
						<div className="text-sm text-gray-500">
							Sắp tái khám
						</div>
					</div>
				</div>
			)}

			{/* Medical Record Modal */}
			<MedicalRecordModal
				record={selectedRecord}
				isOpen={isModalOpen}
				onClose={handleCloseModal}
			/>
		</div>
	);
};

const AdminDashboard = () => {
	const [currentView, setCurrentView] = useState("dashboard");
	const [users, setUsers] = useState([]);
	const [medicalRecords, setMedicalRecords] = useState([]);
	const [blockchainInfo, setBlockchainInfo] = useState(null);
	const [loading, setLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const { user } = useAuth();

	const fetchAllMedicalRecords = async () => {
		setLoading(true);
		try {
			const response = await apiGetAllMedicalRecords();
			return response;
		} catch (error) {
			console.error("Error fetching medical records:", error);
		}
		setLoading(false);
	};
	const fetchUsers = async () => {
		setLoading(true);
		try {
			const response = await apiGetAllUsers();
			return response.data;
		} catch (error) {
			console.error("Error fetching users:", error);
		}
		setLoading(false);
	};
	const fetchBlockchainInfo = async () => {
		setLoading(true);
		try {
			const response = await apiGetBlockchainInformation();
			return response;
		} catch (error) {
			console.error("Error fetching blockchain info:", error);
		}
		setLoading(false);
	};
	const loadDashboardData = useCallback(async () => {
		setLoading(true);
		try {
			const [usersRes, recordsRes, blockchainRes] = await Promise.all([
				fetchUsers(),
				fetchAllMedicalRecords(),
				fetchBlockchainInfo(),
			]);

			setUsers(usersRes.users);
			setMedicalRecords(recordsRes.data);
			setBlockchainInfo(blockchainRes.data);
		} catch (error) {
			console.error("Error loading data:", error);
		}
		setLoading(false);
	}, []);

	// Load data
	useEffect(() => {
		loadDashboardData();
	}, [loadDashboardData]);

	async function verifyBlockchain() {
		const response = await fetch(
			`${import.meta.env.VITE_API_URI}/blockchain/verify`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${localStorage.getItem(
						"accessToken"
					)}`,
				},
			}
		);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		return response.json();
	}
	const handleVerifyBlockchain = async () => {
		setLoading(true);
		try {
			const result = await verifyBlockchain();
			Swal.fire({
				title: result.success
					? "Xác thực thành công"
					: "Xác thực thất bại",
				text: result.data.message,
				icon: result.success ? "success" : "error",
			});
		} catch (error) {
			console.error("Error verifying blockchain:", error);
			Swal.fire({
				title: "Lỗi xác thực",
				text: error.message || "Đã xảy ra lỗi khi xác thực blockchain",
				icon: "error",
			});
		}
		setLoading(false);
	};

	// Navigation items
	const navItems = [
		{ id: "dashboard", label: "Tổng quan", icon: Activity },
		{ id: "users", label: "Người dùng", icon: Users },
		{ id: "records", label: "Hồ sơ y tế", icon: FileText },
		{ id: "blockchain", label: "Blockchain", icon: Shield },
	];

	if (user?.role !== "admin") {
		return (
			<UnauthorizedAccess
				user={user}
				allowedRole="admin"
			/>
		);
	}

	return (
		<div className="min-h-screen bg-gray-100">
			{/* Header */}
			<header className="bg-white shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<div className="flex items-center">
							<Shield className="w-8 h-8 text-blue-600 mr-3" />
							<h1 className="text-xl font-bold text-gray-900">
								Admin Dashboard
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600">
								Quản trị viên
							</span>
							<div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
								<UserCheck className="w-4 h-4 text-white" />
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Sidebar */}
					<div className="lg:w-64">
						<nav className="bg-white rounded-lg shadow-md p-4">
							<ul className="space-y-2">
								{navItems.map((item) => {
									const Icon = item.icon;
									return (
										<li key={item.id}>
											<button
												onClick={() =>
													setCurrentView(item.id)
												}
												className={`w-full flex items-center px-4 py-2 text-left rounded-lg transition-colors ${
													currentView === item.id
														? "bg-blue-100 text-blue-700 font-medium"
														: "text-gray-600 hover:bg-gray-100"
												}`}>
												<Icon className="w-5 h-5 mr-3" />
												{item.label}
											</button>
										</li>
									);
								})}
							</ul>
						</nav>
					</div>

					{/* Main content */}
					<div className="flex-1">
						{currentView === "dashboard" && (
							<DashboardView
								users={users}
								medicalRecords={medicalRecords}
								blockchainInfo={blockchainInfo}
								loading={loading}
								onLoadData={loadDashboardData}
								onVerifyBlockchain={handleVerifyBlockchain}
							/>
						)}
						{currentView === "users" && (
							<UsersView
								users={users}
								searchTerm={searchTerm}
								onSearchChange={setSearchTerm}
							/>
						)}
						{currentView === "records" && (
							<MedicalRecordsView
								medicalRecords={medicalRecords}
								searchTerm={searchTerm}
								onSearchChange={setSearchTerm}
								onVerifyBlockchain={handleVerifyBlockchain}
							/>
						)}
						{currentView === "blockchain" && <BlockchainView />}
					</div>
				</div>
			</div>
		</div>
	);
};
export default AdminDashboard;
