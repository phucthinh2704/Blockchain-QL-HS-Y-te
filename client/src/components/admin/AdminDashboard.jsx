import {
	Activity,
	Calendar,
	CheckCircle,
	ChevronRight,
	Database,
	Edit3,
	Eye,
	FileText,
	Phone,
	Plus,
	Shield,
	Trash2,
	User,
	Users,
	X,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import useAuth from "../../hooks/useAuth";
import Sidebar from "../common/Sidebar";
import UnauthorizedAccess from "../common/UnauthorizedAccess";
import AdminHeader from "./AdminHeader";
import { useEffect } from "react";
import { apiGetAllRecordsByAdmin } from "../../apis/record";
import Swal from "sweetalert2";
import { apiGetAllUsers, apiRegister, apiUpdateUser } from "../../apis/user";
import { apiGetBlockchainByAdmin } from "../../apis/blockchain";
import AddUserModal from "./AddUserModal";
import moment from "moment";

const AdminDashboard = () => {
	const [activeTab, setActiveTab] = useState("dashboard");
	const [selectedUser, setSelectedUser] = useState(null);
	const [selectedRecord, setSelectedRecord] = useState(null);

	const [showAddUserModal, setShowAddUserModal] = useState(false);
	const [showBlockchainModal, setShowBlockchainModal] = useState(false);
	const [showRecordModal, setShowRecordModal] = useState(false);
	const [showVerificationResults, setShowVerificationResults] =
		useState(false);
	const [verificationData, setVerificationData] = useState(null);
	const [loading, setLoading] = useState(false);

	const { user } = useAuth();

	// Form states
	const [userFormData, setUserFormData] = useState({
		email: "",
		password: "",
		name: "",
		role: "patient",
		phoneNumber: "",
		dateOfBirth: "",
	});

	const [recordFormData, setRecordFormData] = useState({
		patientId: "",
		diagnosis: "",
		treatment: "",
		medication: "",
		doctorNote: "",
		dateBack: "",
	});

	// Filter states
	const [userFilter, setUserFilter] = useState("all");
	const [recordFilter, setRecordFilter] = useState("all");
	const [searchTerm, setSearchTerm] = useState("");

	// Mock data updated to match MongoDB models
	const [users, setUsers] = useState([]);

	const [medicalRecords, setMedicalRecords] = useState([]);

	// Mock blockchain blocks data
	const [blockchainBlocks, setBlockchainBlocks] = useState([]);

	const [blockchainStats, setBlockchainStats] = useState({
		totalBlocks: 1247,
		validBlocks: 1247,
		invalidBlocks: 0,
		lastBlockTime: "2025-01-31T10:30:00.000Z",
		networkStatus: "healthy",
		integrityPercentage: 100,
	});

	const fetchMedicalRecords = async () => {
		try {
			const response = await apiGetAllRecordsByAdmin();
			if (!response.success) {
				Swal.fire({
					title: "Error",
					text: response.message,
					icon: "error",
					confirmButtonText: "OK",
				});
			} else {
				setMedicalRecords(response.data);
				// setUsers()
			}
		} catch (error) {
			console.error("Error fetching medical records:", error);
		}
	};
	useEffect(() => {
		fetchMedicalRecords();
	}, []);

	const fetchUsers = async () => {
		try {
			// Simulate fetching users from API
			const response = await apiGetAllUsers();
			if (!response.success) {
				Swal.fire({
					title: "Error",
					text: response.message,
					icon: "error",
					confirmButtonText: "OK",
				});
			} else {
				setUsers(response.data.users);
			}
		} catch (error) {
			console.error("Error fetching users:", error);
		}
	};
	useEffect(() => {
		fetchUsers();
	}, []);

	useEffect(() => {
		const fetchBlockchainData = async () => {
			try {
				// Simulate fetching blockchain data from API
				const response = await apiGetBlockchainByAdmin();
				if (!response.success) {
					Swal.fire({
						title: "Error",
						text: response.message,
						icon: "error",
						confirmButtonText: "OK",
					});
				} else {
					setBlockchainBlocks(response.data);
               console.log(response.data)
               setBlockchainStats({
                  totalBlocks: response.data.length,
                  validBlocks: response.data.filter((block) => block.isValid).length,
                  invalidBlocks: response.data.filter((block) => !block.isValid).length,
                  lastBlockTime: response.data[response.data.length - 1].timestamp,
                  networkStatus: "healthy",
                  integrityPercentage: 100,
               });
				}
			} catch (error) {
				console.error("Error fetching blockchain data:", error);
			}
		};

		fetchBlockchainData();
	}, []);

	if (!user || user.role !== "admin") {
		return (
			<UnauthorizedAccess
				user={user}
				allowedRole={"admin"}
			/>
		);
	}

	// Event handlers
	const handleUserInputChange = (e) => {
		const { name, value } = e.target;
		setUserFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleRecordInputChange = (e) => {
		const { name, value } = e.target;
		setRecordFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleUserSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		if (userFormData.password.length < 6 && !selectedUser) {
			Swal.fire({
				title: "Error",
				text: "Mật khẩu phải có ít nhất 6 ký tự!",
				icon: "error",
			});
			setLoading(false);
			return;
		}
		if (
			userFormData.phoneNumber === "" ||
			!/^\d{10,15}$/.test(userFormData.phoneNumber)
		) {
			Swal.fire({
				title: "Error",
				text: "Số điện thoại không được để trống hoặc không hợp lệ!",
				icon: "error",
			});
			setLoading(false);
			return;
		}
		if (
			userFormData.dateOfBirth === "" ||
			userFormData.dateOfBirth > new Date().toISOString().split("T")[0]
		) {
			Swal.fire({
				title: "Error",
				text: "Ngày sinh không được để trống hoặc không hợp lệ!",
				icon: "error",
			});
			setLoading(false);
			return;
		}

		try {
			let response = {};
			if (!selectedUser) {
				// Update existing user
				response = await apiRegister(userFormData);
			} else {
				const data = {
					name: userFormData.name,
					email: userFormData.email,
					role: userFormData.role,
					phoneNumber: userFormData.phoneNumber,
					dateOfBirth: userFormData.dateOfBirth,
				};
				if (userFormData.password) {
					if (userFormData.password.length < 6) {
						Swal.fire({
							title: "Error",
							text: "Mật khẩu phải có ít nhất 6 ký tự!",
							icon: "error",
						});
						return;
					}
					data.password = userFormData.password;
				}
				response = await apiUpdateUser(selectedUser._id, data);
			}
			if (!response.success) {
				Swal.fire({
					title: "Error",
					text: response.message,
					icon: "error",
				});
			} else {
				Swal.fire({
					title: "Thành công",
					text: selectedUser
						? "Người dùng được cập nhật!"
						: "Người dùng đã được tạo thành công!",
					icon: "success",
				});

				setUserFormData({
					email: "",
					password: "",
					name: "",
					role: "patient",
					phoneNumber: "",
					dateOfBirth: "",
				});
				setShowAddUserModal(false);
            setSelectedUser(null);
				fetchUsers();
			}
		} catch (error) {
			console.error("Error creating user:", error);
			alert("Có lỗi xảy ra khi tạo người dùng!");
		} finally {
			setLoading(false);
		}
	};

	const handleRecordSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			// Simulate API call
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const selectedPatient = users.find(
				(u) => u._id === recordFormData.patientId
			);
			const currentDoctor = users.find((u) => u.role === "doctor"); // Simulate current doctor

			// Generate new ObjectId-like string
			const generateObjectId = () => {
				return (
					Math.floor(Date.now() / 1000).toString(16) +
					"xxxxxxxxxxxxxxxx".replace(/[x]/g, () =>
						Math.floor(Math.random() * 16).toString(16)
					)
				);
			};

			const recordId = generateObjectId();
			const newBlockIndex = blockchainStats.totalBlocks + 1;
			const newHash = `0x${Math.random()
				.toString(16)
				.substring(2, 18)}${"x".repeat(46)}`;

			const newRecord = {
				_id: recordId,
				patientId: recordFormData.patientId,
				doctorId: currentDoctor?._id || "507f1f77bcf86cd799439011",
				...recordFormData,
				blockchainHash: newHash,
				blockIndex: newBlockIndex,
			};

			// Create corresponding blockchain block
			const newBlock = {
				_id: generateObjectId(),
				index: newBlockIndex,
				timestamp: new Date().toISOString(),
				data: {
					recordId: recordId,
					patientId: recordFormData.patientId,
					doctorId: currentDoctor?._id || "507f1f77bcf86cd799439011",
					diagnosis: recordFormData.diagnosis,
					treatment: recordFormData.treatment,
					medication: recordFormData.medication,
					doctorNote: recordFormData.doctorNote,
					dateBack: recordFormData.dateBack
						? new Date(recordFormData.dateBack).toISOString()
						: null,
					action: "create",
				},
				previousHash:
					blockchainBlocks.length > 0
						? blockchainBlocks[blockchainBlocks.length - 1].hash
						: "0x0000000000000000000000000000000000000000000000000000000000000000",
				hash: newHash,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			setMedicalRecords((prev) => [...prev, newRecord]);
			setBlockchainBlocks((prev) => [...prev, newBlock]);
			setBlockchainStats((prev) => ({
				...prev,
				totalBlocks: prev.totalBlocks + 1,
				validBlocks: prev.validBlocks + 1,
				lastBlockTime: new Date().toISOString(),
			}));

			alert("Hồ sơ đã được tạo thành công!");
			setRecordFormData({
				patientId: "",
				diagnosis: "",
				treatment: "",
				medication: "",
				doctorNote: "",
				dateBack: "",
			});
			setShowRecordModal(false);
		} catch (error) {
			console.error("Error creating record:", error);
			alert("Có lỗi xảy ra khi tạo hồ sơ!");
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteUser = async (userId) => {
		Swal.fire({
			title: "Xác nhận xóa",
			text: "Bạn có chắc chắn muốn xóa người dùng này?",
			icon: "warning",
			showCancelButton: true,
			confirmButtonText: "Xóa",
			cancelButtonText: "Hủy",
			cancelButtonColor: "#d33",
			confirmButtonColor: "#3085d6",
		}).then(async (result) => {
			if (result.isConfirmed) {
				setLoading(true);
				try {
					await new Promise((resolve) => setTimeout(resolve, 500));
					setUsers((prev) =>
						prev.filter((user) => user._id !== userId)
					);
					Swal.fire({
						title: "Thành công",
						text: "Người dùng đã được xóa thành công!",
						icon: "success",
					});
				} catch (error) {
					console.error("Error deleting user:", error);
					alert("Có lỗi xảy ra khi xóa người dùng!");
				} finally {
					setLoading(false);
				}
			}
		});
	};

	const handleDeleteRecord = async (recordId) => {
		if (window.confirm("Bạn có chắc chắn muốn xóa hồ sơ này?")) {
			setLoading(true);
			try {
				await new Promise((resolve) => setTimeout(resolve, 500));
				setMedicalRecords((prev) =>
					prev.filter((record) => record._id !== recordId)
				);
				alert("Xóa hồ sơ thành công!");
			} catch (error) {
				console.error("Error deleting record:", error);
				alert("Có lỗi xảy ra khi xóa hồ sơ!");
			} finally {
				setLoading(false);
			}
		}
	};

	const handleVerifyBlockchain = async () => {
		setLoading(true);
		setShowBlockchainModal(true);

		try {
			// Simulate blockchain verification
			await new Promise((resolve) => setTimeout(resolve, 2000));

			const mockVerificationResult = {
				valid: Math.random() > 0.1, // 90% chance of valid
				totalBlocks: blockchainStats.totalBlocks,
				validBlocks: blockchainStats.validBlocks,
				invalidBlocks: blockchainStats.invalidBlocks,
				message: "Blockchain verification completed",
				details: blockchainBlocks.slice(-5).map((block) => ({
					blockIndex: block.index,
					isValid: true,
					hash: block.hash.substring(0, 12) + "...",
					timestamp: block.timestamp,
				})),
			};

			setVerificationData(mockVerificationResult);
			setShowVerificationResults(true);
		} catch (error) {
			console.error("Error verifying blockchain:", error);
			alert("Có lỗi xảy ra khi xác thực blockchain!");
		} finally {
			setLoading(false);
			setShowBlockchainModal(false);
		}
	};

	// Filter functions
	const filteredUsers = users.filter((user) => {
		const matchesFilter = userFilter === "all" || user.role === userFilter;
		const matchesSearch =
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesFilter && matchesSearch;
	});

	const filteredRecords = medicalRecords.filter((record) => {
		const matchesFilter =
			recordFilter === "all" || record.status === recordFilter;
		const matchesSearch =
			record.patientId.name
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesFilter && matchesSearch;
	});

	const patients = users.filter((u) => u.role === "patient");
	const doctors = users.filter((u) => u.role === "doctor");

	const Dashboard = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{[
					{
						title: "Tổng người dùng",
						value: users.filter((u) => u.role !== "admin").length,
						change: `${patients.length} bệnh nhân, ${doctors.length} bác sĩ`,
						icon: Users,
						color: "blue",
					},
					{
						title: "Hồ sơ y tế",
						value: medicalRecords.length,
						change: "+12%",
						icon: FileText,
						color: "green",
					},
					{
						title: "Blockchain blocks",
						value: blockchainStats.totalBlocks,
						change: "+8%",
						icon: Database,
						color: "purple",
					},
					{
						title: "Tính toàn vẹn",
						value: `${blockchainStats.integrityPercentage}%`,
						change: "0%",
						icon: Shield,
						color: "emerald",
					},
				].map((stat, index) => (
					<div
						key={index}
						className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-l-4 border-blue-500">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<p className="text-gray-600 text-sm font-medium">
									{stat.title}
								</p>
								<p className="text-3xl font-bold mt-1 text-gray-800">
									{stat.value}
								</p>
								<p className="text-sm mt-2">
									<span
										className={`font-semibold ${
											stat.change.startsWith("+")
												? "text-green-600"
												: "text-red-600"
										}`}>
										{stat.change}
									</span>
									{index !== 0 && (
										<span className="text-gray-500 ml-1">
											so với tháng trước
										</span>
									)}
								</p>
							</div>
							<div className="bg-blue-50 p-3 rounded-full">
								<stat.icon className="w-8 h-8 text-blue-600" />
							</div>
						</div>
					</div>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white rounded-xl shadow-lg p-6">
					<h3 className="text-lg font-semibold mb-4 flex items-center">
						<Activity className="w-5 h-5 mr-2 text-blue-500" />
						Hoạt động gần đây
					</h3>
					<div className="space-y-3">
						{[
							{
								action: "Tạo hồ sơ bệnh nhân",
								user: "Dr. Nguyễn Văn A",
								time: "10:30 AM",
								type: "create",
							},
							{
								action: "Cập nhật thông tin bệnh nhân",
								user: "Trần Thị B",
								time: "9:15 AM",
								type: "update",
							},
							{
								action: "Xác thực blockchain",
								user: "System",
								time: "8:45 AM",
								type: "verify",
							},
							{
								action: "Đăng ký tài khoản mới",
								user: "Lê Văn C",
								time: "8:30 AM",
								type: "register",
							},
						].map((activity, index) => (
							<div
								key={index}
								className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg transition-colors">
								<div
									className={`p-2 rounded-full ${
										activity.type === "create"
											? "bg-green-100"
											: activity.type === "update"
											? "bg-blue-100"
											: activity.type === "verify"
											? "bg-purple-100"
											: "bg-gray-100"
									}`}>
									{activity.type === "create" && (
										<Plus className="w-4 h-4 text-green-600" />
									)}
									{activity.type === "update" && (
										<Edit3 className="w-4 h-4 text-blue-600" />
									)}
									{activity.type === "verify" && (
										<Shield className="w-4 h-4 text-purple-600" />
									)}
									{activity.type === "register" && (
										<User className="w-4 h-4 text-gray-600" />
									)}
								</div>
								<div className="flex-1">
									<p className="font-medium text-gray-800">
										{activity.action}
									</p>
									<p className="text-sm text-gray-600">
										{activity.user} • {activity.time}
									</p>
								</div>
								<ChevronRight className="w-4 h-4 text-gray-400" />
							</div>
						))}
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-lg p-6">
					<h3 className="text-lg font-semibold mb-4 flex items-center">
						<Calendar className="w-5 h-5 mr-2 text-orange-500" />
						Hẹn tái khám sắp tới
					</h3>
					<div className="space-y-3">
						{medicalRecords
							.filter(
								(record) =>
									record.dateBack &&
									new Date(record.dateBack) >= new Date()
							)
							.sort(
								(a, b) =>
									new Date(a.dateBack) - new Date(b.dateBack)
							)
							.slice(0, 4)
							.map((record, index) => (
								<div
									key={index}
									className="flex items-center space-x-4 p-3 bg-orange-50 rounded-lg">
									<div className="bg-orange-100 p-2 rounded-full">
										<Calendar className="w-4 h-4 text-orange-600" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-gray-800">
											{record.patientId.name}
										</p>
										<p className="text-sm text-gray-600">
											{moment(record.dateBack).format(
												"DD/MM/YYYY"
											)}{" "}
											• {record.doctorId.name}
										</p>
									</div>
									<div className="text-xs text-orange-600 font-medium">
										{Math.ceil(
											(new Date(record.dateBack) -
												new Date()) /
												(1000 * 60 * 60 * 24)
										)}{" "}
										ngày
									</div>
								</div>
							))}
						{medicalRecords.filter(
							(r) =>
								r.dateBack && new Date(r.dateBack) >= new Date()
						).length === 0 && (
							<p className="text-gray-500 text-center py-4">
								Không có hẹn tái khám nào
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	const UserManagement = () => (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex flex-wrap gap-3">
					<button
						onClick={() => setShowAddUserModal(true)}
						className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 cursor-pointer">
						<Plus className="w-4 h-4" />
						<span>Thêm người dùng</span>
					</button>
				</div>
				<div className="flex flex-wrap gap-3">
					<select
						value={userFilter}
						onChange={(e) => setUserFilter(e.target.value)}
						className="border border-gray-300 rounded-lg px-3 py-2">
						<option value="all">Tất cả vai trò</option>
						<option value="doctor">Bác sĩ</option>
						<option value="patient">Bệnh nhân</option>
						<option value="admin">Admin</option>
					</select>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Người dùng
								</th>
								<th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Vai trò
								</th>
								<th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Liên hệ
								</th>
								<th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Ngày sinh
								</th>
								<th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Ngày tạo
								</th>
								<th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Trạng thái
								</th>
								<th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Thao tác
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{filteredUsers.map((user) => (
								<tr
									key={user._id}
									className="hover:bg-gray-50 transition-colors">
									<td className="px-6 py-4">
										<div className="flex items-center space-x-3">
											<div className="bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">
												{user.name
													.charAt(0)
													.toUpperCase()}
											</div>
											<div>
												<p className="font-semibold text-gray-800">
													{user.name}
												</p>
												<p className="text-sm text-gray-600">
													{user.email}
												</p>
											</div>
										</div>
									</td>
									<td className="px-6 py-4 text-center">
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												user.role === "doctor"
													? "bg-blue-100 text-blue-800"
													: user.role === "patient"
													? "bg-green-100 text-green-800"
													: "bg-purple-100 text-purple-800"
											}`}>
											{user.role === "doctor"
												? "Bác sĩ"
												: user.role === "patient"
												? "Bệnh nhân"
												: "Admin"}
										</span>
									</td>
									<td className="px-6 py-4 text-sm text-gray-600">
										<div className="flex items-center justify-center space-x-1">
											<Phone className="w-3 h-3" />
											<span>
												{user.phoneNumber || "Chưa có"}
											</span>
										</div>
									</td>
									<td className="px-6 py-4 text-sm text-gray-600 text-center">
										{user.dateOfBirth
											? moment(user.dateOfBirth).format(
													"DD/MM/YYYY"
											  )
											: "Chưa có"}
									</td>
									<td className="px-6 py-4 text-sm text-gray-600 text-center">
										{moment(user.createdAt).format(
											"DD/MM/YYYY"
										)}
									</td>
									<td className="px-6 py-4 text-center">
										<span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
											Hoạt động
										</span>
									</td>
									<td className="px-6 py-4">
										<div className="flex justify-center space-x-2">
											<button
												onClick={() =>
													setSelectedUser(user)
												}
												className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
												title="Xem chi tiết">
												<Eye className="w-4 h-4" />
											</button>
											<button
												onClick={() => {
													setSelectedUser(user);
													setUserFormData({
														...user,
														password: "",
													});
													setShowAddUserModal(true);
												}}
												className="text-green-600 hover:text-green-800 transition-colors cursor-pointer"
												title="Chỉnh sửa">
												<Edit3 className="w-4 h-4" />
											</button>
											<button
												onClick={() =>
													handleDeleteUser(user._id)
												}
												className="text-red-600 hover:text-red-800 transition-colors cursor-pointer"
												title="Xóa">
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);

	const RecordManagement = () => (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div className="flex flex-wrap gap-3">
					<button
						onClick={() => setShowRecordModal(true)}
						className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
						<Plus className="w-4 h-4" />
						<span>Thêm hồ sơ</span>
					</button>
				</div>
				<div className="flex flex-wrap gap-3">
					<select
						value={recordFilter}
						onChange={(e) => setRecordFilter(e.target.value)}
						className="border border-gray-300 rounded-lg px-3 py-2">
						<option value="all">Tất cả trạng thái</option>
						<option value="completed">Hoàn thành</option>
						<option value="ongoing">Đang theo dõi</option>
					</select>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-lg overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead className="bg-gray-50">
							<tr>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Bệnh nhân
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Bác sĩ
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Chẩn đoán
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Ngày tạo
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Tái khám
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Trạng thái
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Blockchain
								</th>
								<th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
									Thao tác
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200">
							{filteredRecords.map((record) => (
								<tr
									key={record._id}
									className="hover:bg-gray-50 transition-colors">
									<td className="px-6 py-4">
										<div className="flex items-center space-x-3">
											<div className="bg-green-500 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">
												{record.patientId.name
													.charAt(0)
													.toUpperCase()}
											</div>
											<div>
												<p className="font-semibold text-gray-800">
													{record.patientId.name}
												</p>
												<p className="text-sm text-gray-600">
													ID: {record.patientId._id}
												</p>
											</div>
										</div>
									</td>
									<td className="px-6 py-4">
										<p className="font-medium text-gray-800">
											{record.doctorId.name}
										</p>
									</td>
									<td className="px-6 py-4">
										<p className="text-sm text-gray-800">
											{record.diagnosis}
										</p>
										<p className="text-xs text-gray-500">
											{record.treatment}
										</p>
									</td>
									<td className="px-6 py-4 text-sm text-gray-600">
										{moment(record.createdAt).format(
											"DD/MM/YYYY"
										)}
									</td>
									<td className="px-6 py-4 text-sm text-gray-600">
										{record.dateBack
											? moment(record.dateBack).format(
													"DD/MM/YYYY"
											  )
											: "Không có"}
									</td>
									<td className="px-6 py-4">
										<span
											className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
												record.status === "completed"
													? "bg-green-100 text-green-800"
													: record.status ===
													  "ongoing"
													? "bg-yellow-100 text-yellow-800"
													: "bg-gray-100 text-gray-800"
											}`}>
											{record.status === "completed"
												? "Hoàn thành"
												: record.status === "ongoing"
												? "Đang theo dõi"
												: "Chờ xử lý"}
										</span>
									</td>
									<td className="px-6 py-4">
										<div className="flex items-center space-x-2">
											<div className="bg-purple-100 p-1 rounded">
												<Database className="w-3 h-3 text-purple-600" />
											</div>
											<div>
												<p className="text-xs text-gray-600">
													Block #{record.blockIndex}
												</p>
												<p className="text-xs text-gray-500 font-mono">
													{record.blockchainHash.substring(
														0,
														12
													)}
													...
												</p>
											</div>
										</div>
									</td>
									<td className="px-6 py-4">
										<div className="flex space-x-2">
											<button
												onClick={() =>
													setSelectedRecord(record)
												}
												className="text-blue-600 hover:text-blue-800 transition-colors"
												title="Xem chi tiết">
												<Eye className="w-4 h-4" />
											</button>
											<button
												onClick={() => {
													setSelectedRecord(record);
													setRecordFormData({
														patientId:
															record.patientId,
														diagnosis:
															record.diagnosis,
														treatment:
															record.treatment,
														medication:
															record.medication,
														doctorNote:
															record.doctorNote,
														dateBack:
															record.dateBack
																? record.dateBack.split(
																		"T"
																  )[0]
																: "",
													});
													setShowRecordModal(true);
												}}
												className="text-green-600 hover:text-green-800 transition-colors"
												title="Chỉnh sửa">
												<Edit3 className="w-4 h-4" />
											</button>
											<button
												onClick={() =>
													handleDeleteRecord(
														record._id
													)
												}
												className="text-red-600 hover:text-red-800 transition-colors"
												title="Xóa">
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);

	const BlockchainManagement = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div className="bg-white rounded-xl p-6 shadow-lg">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">
								Tổng số blocks
							</p>
							<p className="text-2xl font-bold text-gray-800">
								{blockchainStats.totalBlocks}
							</p>
						</div>
						<div className="bg-blue-50 p-3 rounded-full">
							<Database className="w-6 h-6 text-blue-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl p-6 shadow-lg">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">
								Blocks hợp lệ
							</p>
							<p className="text-2xl font-bold text-green-600">
								{blockchainStats.validBlocks}
							</p>
						</div>
						<div className="bg-green-50 p-3 rounded-full">
							<CheckCircle className="w-6 h-6 text-green-600" />
						</div>
					</div>
				</div>

				<div className="bg-white rounded-xl p-6 shadow-lg">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-gray-600 text-sm font-medium">
								Blocks lỗi
							</p>
							<p className="text-2xl font-bold text-red-600">
								{blockchainStats.invalidBlocks}
							</p>
						</div>
						<div className="bg-red-50 p-3 rounded-full">
							<XCircle className="w-6 h-6 text-red-600" />
						</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-xl shadow-lg p-6">
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-lg font-semibold">
						Trạng thái Blockchain
					</h3>
					<button
						onClick={handleVerifyBlockchain}
						disabled={loading}
						className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 disabled:opacity-50">
						<Shield className="w-4 h-4" />
						<span>
							{loading
								? "Đang xác thực..."
								: "Xác thực Blockchain"}
						</span>
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div className="space-y-4">
						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
							<span className="font-medium">Trạng thái mạng</span>
							<div className="flex items-center space-x-2">
								<div className="w-2 h-2 bg-green-500 rounded-full"></div>
								<span className="text-green-600 font-medium capitalize">
									{blockchainStats.networkStatus}
								</span>
							</div>
						</div>

						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
							<span className="font-medium">Tính toàn vẹn</span>
							<span className="text-blue-600 font-bold">
								{blockchainStats.integrityPercentage}%
							</span>
						</div>

						<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
							<span className="font-medium">Block cuối cùng</span>
							<span className="text-gray-600">
								{moment(blockchainStats.lastBlockTime).format(
									"DD/MM/YYYY HH:mm"
								)}
							</span>
						</div>
					</div>

					<div className="space-y-4">
						<h4 className="font-semibold text-gray-800">
							Hồ sơ gần đây trên Blockchain
						</h4>
						<div className="space-y-3">
							{blockchainBlocks
								.slice(-3)
								.reverse()
								.map((block, index) => (
									<div
										key={index}
										className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
										<div className="bg-purple-100 p-2 rounded-full">
											<Database className="w-4 h-4 text-purple-600" />
										</div>
										<div className="flex-1">
											<p className="font-medium text-gray-800">
												Block #{block.index}
											</p>
											<p className="text-sm text-gray-600">
												{block.data.action === "create"
													? "Tạo hồ sơ"
													: "Cập nhật"}{" "}
												- {block.data.diagnosis}
											</p>
											<p className="text-xs text-gray-500 font-mono">
												{block.hash.substring(0, 16)}...
											</p>
										</div>
									</div>
								))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	// Modal Components
	const AddRecordModal = () =>
		showRecordModal && (
			<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">
							{selectedRecord
								? "Chỉnh sửa hồ sơ"
								: "Tạo hồ sơ y tế mới"}
						</h3>
						<button
							onClick={() => {
								setShowRecordModal(false);
								setSelectedRecord(null);
								setRecordFormData({
									patientId: "",
									diagnosis: "",
									treatment: "",
									medication: "",
									doctorNote: "",
									dateBack: "",
								});
							}}
							className="text-gray-500 hover:text-gray-700">
							<X className="w-5 h-5" />
						</button>
					</div>

					<form
						onSubmit={handleRecordSubmit}
						className="space-y-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								Bệnh nhân
							</label>
							<select
								name="patientId"
								value={recordFormData.patientId}
								onChange={handleRecordInputChange}
								className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required>
								<option value="">Chọn bệnh nhân</option>
								{patients.map((patient) => (
									<option
										key={patient._id}
										value={patient._id}>
										{patient.name} - {patient.email}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">
								Chẩn đoán
							</label>
							<textarea
								name="diagnosis"
								value={recordFormData.diagnosis}
								onChange={handleRecordInputChange}
								rows="3"
								className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">
								Phương pháp điều trị
							</label>
							<textarea
								name="treatment"
								value={recordFormData.treatment}
								onChange={handleRecordInputChange}
								rows="3"
								className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">
								Thuốc kê đơn
							</label>
							<textarea
								name="medication"
								value={recordFormData.medication}
								onChange={handleRecordInputChange}
								rows="2"
								className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">
								Ghi chú của bác sĩ
							</label>
							<textarea
								name="doctorNote"
								value={recordFormData.doctorNote}
								onChange={handleRecordInputChange}
								rows="3"
								className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium mb-1">
								Ngày tái khám
							</label>
							<input
								type="date"
								name="dateBack"
								value={recordFormData.dateBack}
								onChange={handleRecordInputChange}
								className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div className="flex space-x-3 pt-4">
							<button
								type="submit"
								disabled={loading}
								className="flex-1 bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
								{loading
									? "Đang xử lý..."
									: selectedRecord
									? "Cập nhật"
									: "Tạo hồ sơ"}
							</button>
							<button
								type="button"
								onClick={() => {
									setShowRecordModal(false);
									setSelectedRecord(null);
									setRecordFormData({
										patientId: "",
										diagnosis: "",
										treatment: "",
										medication: "",
										doctorNote: "",
										dateBack: "",
									});
								}}
								className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
								Hủy
							</button>
						</div>
					</form>
				</div>
			</div>
		);

	const UserDetailModal = () =>
		selectedUser &&
		!showAddUserModal && (
			<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">
							Chi tiết người dùng
						</h3>
						<button
							onClick={() => setSelectedUser(null)}
							className="text-gray-500 hover:text-gray-700 cursor-pointer">
							<X className="w-5 h-5" />
						</button>
					</div>

					<div className="space-y-4">
						<div className="flex items-center space-x-4">
							<div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl">
								{selectedUser.name.charAt(0).toUpperCase()}
							</div>
							<div>
								<h4 className="text-xl font-semibold">
									{selectedUser.name}
								</h4>
								<p className="text-gray-600">
									{selectedUser.email}
								</p>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex justify-between">
								<span className="font-medium">Vai trò:</span>
								<span
									className={`px-2 py-1 rounded-full text-xs font-semibold ${
										selectedUser.role === "doctor"
											? "bg-blue-100 text-blue-800"
											: selectedUser.role === "patient"
											? "bg-green-100 text-green-800"
											: "bg-purple-100 text-purple-800"
									}`}>
									{selectedUser.role === "doctor"
										? "Bác sĩ"
										: selectedUser.role === "patient"
										? "Bệnh nhân"
										: "Admin"}
								</span>
							</div>

							<div className="flex justify-between">
								<span className="font-medium">
									Số điện thoại:
								</span>
								<span>
									{selectedUser.phoneNumber || "Chưa có"}
								</span>
							</div>

							<div className="flex justify-between">
								<span className="font-medium">Ngày sinh:</span>
								<span>
									{selectedUser.dateOfBirth
										? moment(
												selectedUser.dateOfBirth
										  ).format("DD/MM/YYYY")
										: "Chưa có"}
								</span>
							</div>

							<div className="flex justify-between">
								<span className="font-medium">Ngày tạo:</span>
								<span>
									{moment(selectedUser.createdAt).format(
										"DD/MM/YYYY"
									)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="font-medium">Ngày cập nhật:</span>
								<span>
									{moment(selectedUser.updatedAt).format(
										"DD/MM/YYYY"
									)}
								</span>
							</div>

							<div className="flex justify-between">
								<span className="font-medium">Trạng thái:</span>
								<span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
									Hoạt động
								</span>
							</div>
						</div>

						<div className="pt-4 border-t">
							<button
								onClick={() => setSelectedUser(null)}
								className="cursor-pointer w-full bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
								Đóng
							</button>
						</div>
					</div>
				</div>
			</div>
		);

	const RecordDetailModal = () =>
		selectedRecord &&
		!showRecordModal && (
			<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">
							Chi tiết hồ sơ y tế
						</h3>
						<button
							onClick={() => setSelectedRecord(null)}
							className="text-gray-500 hover:text-gray-700">
							<X className="w-5 h-5" />
						</button>
					</div>

					<div className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-3">
								<h4 className="font-semibold text-gray-800 border-b pb-2">
									Thông tin bệnh nhân
								</h4>
								<div className="flex justify-between">
									<span className="font-medium">
										Tên bệnh nhân:
									</span>
									<span>{selectedRecord.patientId.name}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">
										ID bệnh nhân:
									</span>
									<span>{selectedRecord.patientId._id}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">
										Bác sĩ điều trị:
									</span>
									<span>{selectedRecord.doctorId.name}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">
										Ngày tạo:
									</span>
									<span>
										{moment(
											selectedRecord.createdAt
										).format("DD/MM/YYYY")}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">
										Ngày tái khám:
									</span>
									<span>
										{selectedRecord.dateBack
											? moment(
													selectedRecord.dateBack
											  ).format("DD/MM/YYYY")
											: "Không có"}
									</span>
								</div>
							</div>

							<div className="space-y-3">
								<h4 className="font-semibold text-gray-800 border-b pb-2">
									Thông tin Blockchain
								</h4>
								<div className="flex justify-between">
									<span className="font-medium">
										Block Index:
									</span>
									<span>#{selectedRecord.blockIndex}</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">Hash:</span>
									<span className="font-mono text-sm break-all">
										{selectedRecord.blockchainHash}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="font-medium">
										Trạng thái:
									</span>
									<span
										className={`px-2 py-1 rounded-full text-xs font-semibold ${
											selectedRecord.status ===
											"completed"
												? "bg-green-100 text-green-800"
												: selectedRecord.status ===
												  "ongoing"
												? "bg-yellow-100 text-yellow-800"
												: "bg-gray-100 text-gray-800"
										}`}>
										{selectedRecord.status === "completed"
											? "Hoàn thành"
											: selectedRecord.status ===
											  "ongoing"
											? "Đang theo dõi"
											: "Chờ xử lý"}
									</span>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<h4 className="font-semibold text-gray-800 mb-2">
									Chẩn đoán
								</h4>
								<p className="p-3 bg-gray-50 rounded-lg">
									{selectedRecord.diagnosis}
								</p>
							</div>

							<div>
								<h4 className="font-semibold text-gray-800 mb-2">
									Phương pháp điều trị
								</h4>
								<p className="p-3 bg-gray-50 rounded-lg">
									{selectedRecord.treatment}
								</p>
							</div>

							<div>
								<h4 className="font-semibold text-gray-800 mb-2">
									Thuốc kê đơn
								</h4>
								<p className="p-3 bg-gray-50 rounded-lg">
									{selectedRecord.medication || "Không có"}
								</p>
							</div>

							<div>
								<h4 className="font-semibold text-gray-800 mb-2">
									Ghi chú của bác sĩ
								</h4>
								<p className="p-3 bg-gray-50 rounded-lg">
									{selectedRecord.doctorNote ||
										"Không có ghi chú"}
								</p>
							</div>
						</div>

						<div className="pt-4 border-t">
							<button
								onClick={() => setSelectedRecord(null)}
								className="w-full bg-gray-100 text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
								Đóng
							</button>
						</div>
					</div>
				</div>
			</div>
		);

	const BlockchainModal = () =>
		showBlockchainModal && (
			<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
						<h3 className="text-lg font-semibold mb-2">
							Đang xác thực Blockchain
						</h3>
						<p className="text-gray-600">
							Đang kiểm tra tính toàn vẹn của{" "}
							{blockchainStats.totalBlocks} blocks...
						</p>
					</div>
				</div>
			</div>
		);

	const VerificationResultsModal = () =>
		showVerificationResults &&
		verificationData && (
			<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-lg font-semibold">
							Kết quả xác thực Blockchain
						</h3>
						<button
							onClick={() => {
								setShowVerificationResults(false);
								setVerificationData(null);
							}}
							className="text-gray-500 hover:text-gray-700">
							<X className="w-5 h-5" />
						</button>
					</div>

					<div className="space-y-6">
						<div
							className={`p-4 rounded-lg ${
								verificationData.valid
									? "bg-green-50 border border-green-200"
									: "bg-red-50 border border-red-200"
							}`}>
							<div className="flex items-center space-x-3">
								{verificationData.valid ? (
									<CheckCircle className="w-8 h-8 text-green-600" />
								) : (
									<XCircle className="w-8 h-8 text-red-600" />
								)}
								<div>
									<h4
										className={`font-semibold ${
											verificationData.valid
												? "text-green-800"
												: "text-red-800"
										}`}>
										{verificationData.valid
											? "Blockchain hợp lệ"
											: "Phát hiện lỗi trong Blockchain"}
									</h4>
									<p
										className={`text-sm ${
											verificationData.valid
												? "text-green-600"
												: "text-red-600"
										}`}>
										{verificationData.message}
									</p>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="bg-blue-50 p-4 rounded-lg">
								<h5 className="font-semibold text-blue-800">
									Tổng blocks
								</h5>
								<p className="text-2xl font-bold text-blue-600">
									{verificationData.totalBlocks}
								</p>
							</div>
							<div className="bg-green-50 p-4 rounded-lg">
								<h5 className="font-semibold text-green-800">
									Blocks hợp lệ
								</h5>
								<p className="text-2xl font-bold text-green-600">
									{verificationData.validBlocks}
								</p>
							</div>
							<div className="bg-red-50 p-4 rounded-lg">
								<h5 className="font-semibold text-red-800">
									Blocks lỗi
								</h5>
								<p className="text-2xl font-bold text-red-600">
									{verificationData.invalidBlocks}
								</p>
							</div>
						</div>

						<div>
							<h4 className="font-semibold text-gray-800 mb-3">
								Chi tiết xác thực
							</h4>
							<div className="space-y-2">
								{verificationData.details.map(
									(detail, index) => (
										<div
											key={index}
											className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
											<div className="flex items-center space-x-3">
												{detail.isValid ? (
													<CheckCircle className="w-5 h-5 text-green-600" />
												) : (
													<XCircle className="w-5 h-5 text-red-600" />
												)}
												<span className="font-medium">
													Block #{detail.blockIndex}
												</span>
											</div>
											<span className="font-mono text-sm text-gray-600">
												{detail.hash}
											</span>
										</div>
									)
								)}
							</div>
						</div>

						<div className="pt-4 border-t">
							<button
								onClick={() => {
									setShowVerificationResults(false);
									setVerificationData(null);
								}}
								className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors">
								Đóng
							</button>
						</div>
					</div>
				</div>
			</div>
		);

	const renderContent = () => {
		switch (activeTab) {
			case "dashboard":
				return <Dashboard />;
			case "users":
				return <UserManagement />;
			case "records":
				return <RecordManagement />;
			case "blockchain":
				return <BlockchainManagement />;
			default:
				return <Dashboard />;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<Sidebar
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				blockchainStats={blockchainStats}
			/>
			<AdminHeader
				activeTab={activeTab}
				searchTerm={searchTerm}
				setSearchTerm={setSearchTerm}
				medicalRecords={medicalRecords}
			/>

			<main className="ml-64 p-6">{renderContent()}</main>

			{/* Modals */}
			<AddUserModal
				showAddUserModal={showAddUserModal}
				setShowAddUserModal={setShowAddUserModal}
				selectedUser={selectedUser}
				setSelectedUser={setSelectedUser}
				userFormData={userFormData}
				setUserFormData={setUserFormData}
				handleUserSubmit={handleUserSubmit}
				handleUserInputChange={handleUserInputChange}
				loading={loading}
			/>
			<AddRecordModal />
			<UserDetailModal />
			<RecordDetailModal />
			<BlockchainModal />
			<VerificationResultsModal />

			{/* Loading overlay */}
			{loading && !showBlockchainModal && (
				<div className="fixed inset-0 bg-black/30 bg-opacity-30 flex items-center justify-center z-40">
					<div className="bg-white rounded-lg p-4 flex items-center space-x-3">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
						<span>Đang xử lý...</span>
					</div>
				</div>
			)}
		</div>
	);
};

export default AdminDashboard;
