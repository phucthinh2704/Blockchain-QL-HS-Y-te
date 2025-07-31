import {
	Activity,
	Calendar,
	ChevronRight,
	Clock,
	Edit,
	Eye,
	FileText,
	Plus,
	Search,
	Shield,
	User,
	Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth";
import UnauthorizedAccess from "../common/UnauthorizedAccess";
import {
	apiGetRecordByDoctor,
	apiGetUpcomingAppointments,
} from "../../apis/record";
import Swal from "sweetalert2";
import CreateMedicalRecordForm from "./CreateMedicalRecordForm";
import moment from "moment";
import DetailRecord from "./DetailRecord";
import MedicalRecordEditor from "./MedicalRecordEditor";
import PatientDetailModal from "./PatientDetailModal";
import { useLocation } from "react-router-dom";

const DoctorDashboard = () => {
	const [activeTab, setActiveTab] = useState("dashboard");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedPatient, setSelectedPatient] = useState("");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [records, setRecords] = useState([]);
	const [patients, setPatients] = useState([]);
	const [upcomingAppointments, setUpcomingAppointments] = useState([]);
	const [selectedRecord, setSelectedRecord] = useState({});
	const [showDetailRecord, setShowDetailRecord] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [showDetailPatient, setShowDetailPatient] = useState(false);
	const location = useLocation();

	const { user } = useAuth();

	useEffect(() => {
		const { activeTab } = location.state || {}; // lấy giá trị activeTab
		if (activeTab) {
			setActiveTab(activeTab);
		}
	}, [location.state]);

	const fetchRecords = useCallback(async () => {
		try {
			const response = await apiGetRecordByDoctor(user?._id);
			if (!response.success) {
				Swal.fire({
					icon: "error",
					title: "Lỗi",
					text: response.message || "Không thể lấy hồ sơ y tế.",
				});
				return;
			}
			setRecords(response.data);

			const uniquePatientsMap = new Map();
			response.data.forEach((record) => {
				if (record.patientId) {
					// Đảm bảo patientId tồn tại và đã được populate
					uniquePatientsMap.set(
						record.patientId._id,
						record.patientId
					);
				}
			});
			setPatients(Array.from(uniquePatientsMap.values()));
		} catch (error) {
			console.error("Error fetching records:", error);
		}
	}, [user]);

	useEffect(() => {
		if (user?._id) {
			fetchRecords();
		}
	}, [fetchRecords, user]);

	const fetchUpcomingAppointments = useCallback(async () => {
		try {
			const response = await apiGetUpcomingAppointments(user?._id);
			if (!response.success) {
				Swal.fire({
					icon: "error",
					title: "Lỗi",
					text: response.message || "Không thể lấy hồ sơ y tế.",
				});
				return;
			}
			setUpcomingAppointments(response.data);
		} catch (error) {
			console.error("Error fetching upcoming appointments:", error);
		}
	}, [user?._id]);
	useEffect(() => {
		if (user?._id) {
			fetchUpcomingAppointments();
		}
	}, [fetchUpcomingAppointments, user]);

	if (!user || user?.role !== "doctor") {
		return (
			<UnauthorizedAccess
				user={user}
				allowedRole={"doctor"}
			/>
		);
	}

	// Stats calculations
	const totalPatients = patients.length;
	const totalRecords = records.length;
	const upcomingAppointmentsTotal = upcomingAppointments.length;

	const filterRecords = records.filter((record) => {
		if (!selectedPatient) {
			return (
				record.patientId.name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.patientId.phoneNumber?.includes(searchTerm) ||
				record.patientId.email
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.diagnosis
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.treatment
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.medication
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.doctorNote
					?.toLowerCase()
					.includes(searchTerm.toLowerCase())
			);
		}
		return (
			record.patientId._id === selectedPatient &&
			(record.patientId.name
				?.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
				record.patientId.phoneNumber?.includes(searchTerm) ||
				record.patientId.email
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.diagnosis
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.treatment
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.medication
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				record.doctorNote
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()))
		);
	});

	const handleViewRecord = (record) => {
		setSelectedRecord(record);
		setShowDetailRecord(true);
	};

	const handleEditRecord = (record) => {
		setSelectedRecord(record);
		setIsEditing(true);
	};

	const handleSave = (updatedRecord) => {
		Swal.fire({
			icon: "success",
			title: "Cập nhật thành công",
			text: "Hồ sơ y tế đã được cập nhật thành công.",
		});
		setRecords((prev) =>
			prev.map((rec) =>
				rec._id === updatedRecord._id ? updatedRecord : rec
			)
		);
		fetchRecords();
		fetchUpcomingAppointments();
		setIsEditing(false);
	};

	const handleCancel = () => {
		setIsEditing(false);
	};

	const handleViewDetailPatient = (patient) => {
		setSelectedPatient(patient);
		setShowDetailPatient(true);
	};

	const getStatusText = (status) => {
		switch (status) {
			case "completed":
				return "Đã hoàn thành";
			case "ongoing":
				return "Đang theo dõi";
			default:
				return "Đang theo dõi";
		}
	};

	const StatCard = ({
		// eslint-disable-next-line no-unused-vars
		icon: Icon,
		title,
		value,
		subtitle,
		color = "blue",
	}) => (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
			<div className="flex items-center">
				<div className={`p-3 rounded-lg bg-${color}-100`}>
					<Icon className={`w-6 h-6 text-${color}-600`} />
				</div>
				<div className="ml-4">
					<p className="text-sm font-medium text-gray-600">{title}</p>
					<p className="text-2xl font-bold text-gray-900">{value}</p>
					{subtitle && (
						<p className="text-sm text-gray-500">{subtitle}</p>
					)}
				</div>
			</div>
		</div>
	);

	const PatientCard = ({ patient }) => (
		<div
			className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-lg transition-shadow cursor-pointer"
			onClick={() => handleViewDetailPatient(patient)}>
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
						<User className="w-7 h-7 text-blue-600" />
					</div>
					<div>
						<h3 className="font-medium text-gray-900">
							{patient.name}
						</h3>
						<p className="text-sm text-gray-500">{patient.email}</p>
						<p className="text-sm text-gray-500">
							{patient.phoneNumber}
						</p>
					</div>
				</div>
				<button className="text-blue-600 hover:text-blue-800">
					<ChevronRight className="w-7 h-7" />
				</button>
			</div>
		</div>
	);

	const RecordCard = ({ record }) => (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center space-x-2 mb-2">
						<FileText className="w-4 h-4 text-gray-500" />
						<span className="text-sm font-medium text-gray-900">
							{record.patientId.name}
						</span>
					</div>
					<h3 className="font-medium text-gray-900 mb-2">
						{record.diagnosis}
					</h3>
					<p className="text-sm text-gray-600 mb-2 font-medium">
						Điều trị: {record.treatment}
					</p>
					<div className="flex items-center space-x-4 text-sm text-gray-500">
						<span>Thuốc: {record.medication}</span>
					</div>
					<div className="flex items-center space-x-4 text-sm text-gray-500">
						<span>
							Trạng thái hồ sơ: {getStatusText(record.status)}
						</span>
						<span className="text-red-600">
							Tái khám:{" "}
							{record.dateBack
								? moment(record.dateBack).format("DD/MM/YYYY")
								: "Không có"}
						</span>
					</div>
				</div>
				<div className="flex space-x-2">
					<button
						className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
						onClick={() => handleViewRecord(record)}>
						<Eye className="w-4 h-4" />
					</button>
					<button
						className="p-2 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer"
						onClick={() => handleEditRecord(record)}>
						<Edit className="w-4 h-4" />
					</button>
					<button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg cursor-pointer">
						<Shield className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);

	const AppointmentCard = ({ appointment }) => (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-gray-900">
						{appointment.patientId.name}
					</h3>
					<p className="text-sm text-gray-600 font-medium my-1">
						Chẩn đoán: {appointment.diagnosis}
					</p>
					<p className="text-sm text-blue-600">
						SĐT: {appointment.patientId.phoneNumber}
					</p>
					<p className="text-sm text-red-600">
						Ngày khám:{" "}
						{moment(appointment.createdAt).format("DD/MM/YYYY")}
					</p>
				</div>
				<div className="text-right">
					<p className="text-sm font-medium text-gray-900">
						{moment(appointment.dateBack).format("DD/MM/YYYY")}
					</p>
					<div className="flex items-center text-xs text-orange-600 mt-1">
						<Clock className="w-3 h-3 mr-1" />
						Sắp tới
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Navigation Tabs */}
				<div className="flex space-x-8 mb-8 border-b border-gray-200 text-xl">
					{[
						{ id: "dashboard", label: "Tổng quan", icon: Activity },
						{ id: "records", label: "Hồ sơ y tế", icon: FileText },
						{ id: "patients", label: "Bệnh nhân", icon: Users },
						{
							id: "appointments",
							label: "Lịch hẹn",
							icon: Calendar,
						},
						{ id: "blockchain", label: "Blockchain", icon: Shield },
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors cursor-pointer ${
								activeTab === tab.id
									? "border-blue-600 text-blue-600"
									: "border-transparent text-gray-500 hover:border-blue-600 hover:text-blue-600"
							}`}>
							<tab.icon className="w-4 h-4" />
							<span className="font-medium">{tab.label}</span>
						</button>
					))}
				</div>

				{/* Dashboard Tab */}
				{activeTab === "dashboard" && (
					<div className="space-y-8">
						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<StatCard
								icon={Users}
								title="Tổng số bệnh nhân"
								value={totalPatients}
								subtitle="Đang theo dõi"
								color="blue"
							/>
							<StatCard
								icon={FileText}
								title="Hồ sơ y tế"
								value={totalRecords}
								subtitle="Đã tạo"
								color="green"
							/>
							<StatCard
								icon={Calendar}
								title="Lịch hẹn sắp tới"
								value={upcomingAppointmentsTotal}
								subtitle="Trong tuần"
								color="orange"
							/>
						</div>

						{/* Recent Records and Upcoming Appointments */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<div>
								<h2 className="text-2xl font-semibold text-gray-900 mb-4">
									Hồ sơ gần đây
								</h2>
								<div className="space-y-4">
									{records.slice(0, 3).map((record) => (
										<RecordCard
											key={record._id}
											record={record}
										/>
									))}
								</div>
							</div>
							<div>
								<h2 className="text-lg font-semibold text-gray-900 mb-4">
									Lịch hẹn sắp tới
								</h2>
								<div className="space-y-4">
									{upcomingAppointments.map((appointment) => (
										<AppointmentCard
											key={appointment._id}
											appointment={appointment}
										/>
									))}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Medical Records Tab */}
				{activeTab === "records" && (
					<div className="space-y-6">
						<div className="flex justify-between items-center">
							<h2 className="text-2xl font-semibold text-gray-900">
								Quản lý Hồ sơ Y tế
							</h2>
							<button
								onClick={() => setShowCreateForm(true)}
								className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 cursor-pointer">
								<Plus className="w-4 h-4" />
								<span>Tạo hồ sơ mới</span>
							</button>
						</div>

						{/* Search and Filter */}
						<div className="flex space-x-4">
							<div className="flex-1 relative">
								<Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
								<input
									type="text"
									placeholder="Tìm kiếm theo chẩn đoán, thuốc..."
									value={searchTerm}
									onChange={(e) =>
										setSearchTerm(e.target.value)
									}
									className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								/>
							</div>
							<select
								value={selectedPatient}
								onChange={(e) =>
									setSelectedPatient(e.target.value)
								}
								className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
								<option value="">Tất cả bệnh nhân</option>
								{patients.map((patient) => (
									<option
										key={patient._id}
										value={patient._id}>
										{patient.name}
									</option>
								))}
							</select>
						</div>

						{/* Records List */}
						<div className="space-y-4">
							{filterRecords.length > 0 ? (
								filterRecords.map((record) => (
									<RecordCard
										key={record._id}
										record={record}
									/>
								))
							) : (
								<p className="text-gray-500">
									Không tìm thấy hồ sơ nào.
								</p>
							)}
						</div>
					</div>
				)}

				{/* Patients Tab */}
				{activeTab === "patients" && (
					<div className="space-y-6">
						<h2 className="text-2xl font-semibold text-gray-900">
							Danh sách Bệnh nhân
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{patients.map((patient) => (
								<PatientCard
									key={patient._id}
									patient={patient}
								/>
							))}
						</div>
					</div>
				)}

				{/* Appointments Tab */}
				{activeTab === "appointments" && (
					<div className="space-y-6">
						<h2 className="text-2xl font-semibold text-gray-900">
							Lịch hẹn tái khám
						</h2>
						<div className="space-y-4">
							{upcomingAppointments.map((appointment) => (
								<AppointmentCard
									key={appointment._id}
									appointment={appointment}
								/>
							))}
						</div>
					</div>
				)}

				{/* Blockchain Tab */}
				{activeTab === "blockchain" && (
					<div className="space-y-6">
						<h2 className="text-2xl font-semibold text-gray-900">
							Xác thực Blockchain
						</h2>
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<div className="flex items-center space-x-4 mb-4">
								<Shield className="w-8 h-8 text-green-600" />
								<div>
									<h3 className="text-lg font-medium text-gray-900">
										Trạng thái Blockchain
									</h3>
									<p className="text-sm text-gray-600">
										Tất cả blocks đều hợp lệ và an toàn
									</p>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div className="text-center p-4 bg-green-50 rounded-lg">
									<p className="text-2xl font-bold text-green-600">
										100%
									</p>
									<p className="text-sm text-gray-600">
										Tính toàn vẹn
									</p>
								</div>
								<div className="text-center p-4 bg-blue-50 rounded-lg">
									<p className="text-2xl font-bold text-blue-600">
										{totalRecords}
									</p>
									<p className="text-sm text-gray-600">
										Blocks
									</p>
								</div>
								<div className="text-center p-4 bg-purple-50 rounded-lg">
									<p className="text-2xl font-bold text-purple-600">
										0
									</p>
									<p className="text-sm text-gray-600">
										Lỗi phát hiện
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Create New Record Modal */}
			{showCreateForm && (
				<CreateMedicalRecordForm
					isOpen={showCreateForm}
					onClose={() => setShowCreateForm(false)}
					onSuccess={fetchRecords}
					existingPatients={patients}
					doctorId={user?._id}
				/>
			)}
			{showDetailRecord && (
				<DetailRecord
					record={selectedRecord}
					isOpen={showDetailRecord}
					onClose={() => setShowDetailRecord(false)}
				/>
			)}
			{isEditing && selectedRecord && (
				<MedicalRecordEditor
					record={selectedRecord}
					onSave={handleSave}
					onCancel={handleCancel}
				/>
			)}
			{showDetailPatient && (
				<PatientDetailModal
					patient={selectedPatient}
					isOpen={showDetailPatient}
					onClose={() => {
						setShowDetailPatient(false);
						setSelectedPatient("");
					}}
				/>
			)}
		</div>
	);
};

export default DoctorDashboard;
