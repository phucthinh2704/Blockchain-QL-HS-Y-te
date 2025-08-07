import React, { useState, useEffect } from "react";
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
	CheckCircle,
	AlertTriangle,
	XCircle,
	Stethoscope,
	Heart,
	Database,
} from "lucide-react";
import { formatDate, formatDateTime } from "../../utils/dateUtils";
import { apiGetAllPatients } from "../../apis/user";
import {
	apiCreateMedicalRecord,
	apiGetRecordByDoctor,
	apiGetUpcomingAppointments,
} from "../../apis/record";
import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";
import BlockchainTab from "./BlockchainTab";
import { useCallback } from "react";
import MedicalRecordEditor from "./MedicalRecordEditor";
import UnauthorizedAccess from "../common/UnauthorizedAccess";

const DoctorDashboard = () => {
	const [activeTab, setActiveTab] = useState("dashboard");
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedPatient, setSelectedPatient] = useState("");
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState(null);
	const [showDetailRecord, setShowDetailRecord] = useState(false);
	const [showPatientDetail, setShowPatientDetail] = useState(false);
	const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
	const [isEditing, setIsEditing] = useState(false);

	// Mock data for demonstration
	const [records, setRecords] = useState([
		{
			_id: "1",
			patientId: {
				_id: "p1",
				name: "Nguyễn Văn An",
				email: "an@email.com",
				phoneNumber: "0123456789",
			},
			diagnosis: "Viêm họng cấp tính",
			treatment: "Thuốc kháng sinh + nghỉ ngơi",
			medication: "Amoxicillin 500mg x3/ngày",
			doctorNote: "Bệnh nhân cần uống đủ nước và nghỉ ngơi",
			dateBack: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			status: "ongoing",
			createdAt: new Date(),
			blockchainHash: "a1b2c3d4e5f6...",
			blockIndex: 1,
		},
		{
			_id: "2",
			patientId: {
				_id: "p2",
				name: "Trần Thị Bình",
				email: "binh@email.com",
				phoneNumber: "0987654321",
			},
			diagnosis: "Cao huyết áp",
			treatment: "Điều chỉnh chế độ ăn + thuốc hạ áp",
			medication: "Losartan 50mg x1/ngày",
			doctorNote: "Theo dõi huyết áp hàng tuần",
			dateBack: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
			status: "ongoing",
			createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
			blockchainHash: "b2c3d4e5f6g7...",
			blockIndex: 2,
		},
		{
			_id: "3",
			patientId: {
				_id: "p3",
				name: "Lê Văn Cường",
				email: "cuong@email.com",
				phoneNumber: "0369258147",
			},
			diagnosis: "Đau dạ dày",
			treatment: "Thuốc PPI + chế độ ăn nhẹ",
			medication: "Omeprazole 20mg x2/ngày",
			doctorNote: "Tránh thức ăn cay nóng",
			dateBack: null,
			status: "completed",
			createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
			blockchainHash: "c3d4e5f6g7h8...",
			blockIndex: 3,
		},
	]);

	const [upcomingAppointments, setUpcomingAppointments] = useState([
		{
			_id: "a1",
			patientId: {
				name: "Nguyễn Văn An",
				phoneNumber: "0123456789",
			},
			diagnosis: "Viêm họng cấp tính",
			dateBack: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			createdAt: new Date(),
		},
		{
			_id: "a2",
			patientId: {
				name: "Trần Thị Bình",
				phoneNumber: "0987654321",
			},
			diagnosis: "Cao huyết áp",
			dateBack: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
			createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
		},
	]);

	const [blockchainStats] = useState({
		totalBlocks: 125,
		validBlocks: 125,
		invalidBlocks: 0,
		integrityPercentage: 100,
		networkStatus: "healthy",
	});

	const { user } = useAuth();

	const fetchRecordByDoctor = useCallback(async () => {
		try {
			const response = await apiGetRecordByDoctor(user?._id);
			if (response.success) {
				setRecords(response.data);
			}
		} catch (error) {
			console.error("Error fetching patients:", error);
		}
	}, [user?._id]);
	useEffect(() => {
		if (user?._id) fetchRecordByDoctor();
	}, [fetchRecordByDoctor, user?._id]);

	const fetchUpcomingAppointments = useCallback(async () => {
		try {
			const response = await apiGetUpcomingAppointments(user?._id);
			if (response.success) {
				setUpcomingAppointments(response.data);
			}
		} catch (error) {
			console.error("Error fetching patients:", error);
		}
	}, [user?._id]);
	useEffect(() => {
		if (user?._id) fetchUpcomingAppointments();
	}, [fetchUpcomingAppointments, user?._id]);

	if(user?.role === 'patient') {
		return <UnauthorizedAccess user={user} allowedRole="doctor" />;
	}

	// Extract unique patients from records
	const patients = records.reduce((acc, record) => {
		const exists = acc.find((p) => p._id === record.patientId._id);
		if (!exists) {
			acc.push(record.patientId);
		}
		return acc;
	}, []);

	// Filter records based on search and patient selection
	const filteredRecords = records.filter((record) => {
		const matchesSearch =
			!searchTerm ||
			record.patientId.name
				.toLowerCase()
				.includes(searchTerm.toLowerCase()) ||
			record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.treatment.toLowerCase().includes(searchTerm.toLowerCase()) ||
			record.medication.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesPatient =
			!selectedPatient || record.patientId._id === selectedPatient;

		return matchesSearch && matchesPatient;
	});

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
		icon: Icon,
		title,
		value,
		subtitle,
		color = "blue",
	}) => (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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

	const RecordCard = ({ record }) => (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<div className="flex items-center space-x-2 mb-2">
						<Stethoscope className="w-4 h-4 text-blue-500" />
						<span className="text-sm font-medium text-gray-900">
							{record.patientId.name}
						</span>
						<span className="text-xs text-gray-500">
							{formatDate(record.createdAt)}
						</span>
					</div>
					<h3 className="font-medium text-gray-900 mb-2">
						{record.diagnosis}
					</h3>
					<p className="text-sm text-gray-600 mb-1">
						<span className="font-medium">Điều trị:</span>{" "}
						{record.treatment}
					</p>
					<p className="text-sm text-gray-600 mb-2">
						<span className="font-medium">Thuốc:</span>{" "}
						{record.medication}
					</p>
					<div className="flex items-center justify-between text-sm">
						<span
							className={`px-2 py-1 rounded-full text-xs ${
								record.status === "completed"
									? "bg-green-100 text-green-800"
									: "bg-yellow-100 text-yellow-800"
							}`}>
							{getStatusText(record.status)}
						</span>
						<span className="text-red-600">
							{record.dateBack
								? `Tái khám: ${formatDate(record.dateBack)}`
								: "Không có lịch tái khám"}
						</span>
					</div>
				</div>
				<div className="flex space-x-2 ml-4">
					<button
						onClick={() => handleViewRecord(record)}
						className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
						title="Xem chi tiết">
						<Eye className="w-4 h-4" />
					</button>
					<button
						onClick={() => handleEditRecord(record)}
						className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
						title="Chỉnh sửa">
						<Edit className="w-4 h-4" />
					</button>
					<button
						onClick={() => handleVerifyRecord(record)}
						className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
						title="Xác thực blockchain">
						<Shield className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);

	const PatientCard = ({ patient }) => {
		const patientRecords = records.filter(
			(r) => r.patientId._id === patient._id
		);
		const lastRecord = patientRecords.sort(
			(a, b) => new Date(b.createdAt) - new Date(a.createdAt)
		)[0];

		return (
			<div
				className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
				onClick={() => handleViewPatient(patient)}>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
							<User className="w-6 h-6 text-blue-600" />
						</div>
						<div>
							<h3 className="font-medium text-gray-900">
								{patient.name}
							</h3>
							<p className="text-sm text-gray-500">
								{patient.walletAddress.substring(0, 20) +
									"..." +
									patient.walletAddress.slice(-8) ||
									"0xa1b2c3d4e5f60718293a4b5c6d7e8f901234abcd".substring(
										0,
										20
									) +
										"..." +
										"0xa1b2c3d4e5f60718293a4b5c6d7e8f901234abcd".slice(
											-8
										)}
							</p>
							<p className="text-sm text-gray-500">
								{patient.phoneNumber}
							</p>
							<p className="text-xs text-gray-400">
								{patientRecords.length} hồ sơ
								{lastRecord &&
									` • Khám gần nhất: ${formatDate(
										lastRecord.createdAt
									)}`}
							</p>
						</div>
					</div>
					<ChevronRight className="w-5 h-5 text-gray-400" />
				</div>
			</div>
		);
	};

	const AppointmentCard = ({ appointment }) => (
		<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
			<div className="flex items-center justify-between">
				<div className="flex-1">
					<h3 className="font-medium text-gray-900 mb-1">
						{appointment.patientId.name}
					</h3>
					<p className="text-sm text-gray-600 mb-1">
						<span className="font-medium">Chẩn đoán:</span>{" "}
						{appointment.diagnosis}
					</p>
					<p className="text-sm text-blue-600">
						SĐT: {appointment.patientId.phoneNumber}
					</p>
				</div>
				<div className="text-right">
					<p className="text-sm font-medium text-gray-900">
						{formatDate(appointment.dateBack)}
					</p>
					<div className="flex items-center text-xs text-orange-600 mt-1">
						<Clock className="w-3 h-3 mr-1" />
						Sắp tới
					</div>
				</div>
			</div>
		</div>
	);

	const CreateMedicalRecordModal = ({ isOpen, onClose }) => {
		const [formData, setFormData] = useState({
			patientId: "",
			diagnosis: "",
			treatment: "",
			medication: "",
			doctorNote: "",
			dateBack: "",
		});
		const [patients, setPatients] = useState([]);
		const [loading, setLoading] = useState(false);
		const [loadingPatients, setLoadingPatients] = useState(false);

		// Load danh sách bệnh nhân khi modal mở
		useEffect(() => {
			if (isOpen) {
				loadPatients();
			}
		}, [isOpen]);

		const loadPatients = async () => {
			setLoadingPatients(true);
			try {
				const response = await apiGetAllPatients();

				if (response.success) {
					setPatients(response.data);
				}
			} catch (error) {
				console.error("Error loading patients:", error);
			} finally {
				setLoadingPatients(false);
			}
		};

		if (!isOpen) return null;

		const handleSubmit = async () => {
			setLoading(true);

			try {
				const recordData = {
					patientId: formData.patientId,
					diagnosis: formData.diagnosis,
					treatment: formData.treatment,
					medication: formData.medication,
					doctorNote: formData.doctorNote,
					dateBack: formData.dateBack || null,
				};

				const response = await apiCreateMedicalRecord(recordData);

				if (response.success) {
					Swal.fire({
						icon: "success",
						title: "Tạo hồ sơ thành công",
						text: "Hồ sơ y tế đã được tạo thành công và lưu trữ trên blockchain.",
					});
					onClose();
					setFormData({
						patientId: "",
						diagnosis: "",
						treatment: "",
						medication: "",
						doctorNote: "",
						dateBack: "",
					});
					fetchRecordByDoctor();
					fetchUpcomingAppointments();
				} else {
					Swal.fire({
						icon: "error",
						title: "Lỗi",
						text: `Lỗi: ${response.message}`,
					});
				}
			} catch (error) {
				console.error("Error creating medical record:", error);
				Swal.fire({
					icon: "error",
					title: "Lỗi",
					text: "Có lỗi xảy ra khi tạo hồ sơ!",
				});
			} finally {
				setLoading(false);
			}
		};

		return (
			<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-900">
							Tạo hồ sơ y tế mới
						</h2>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							Swal.fire({
								title: "Xác nhận tạo hồ sơ",
								text: "Bằng việc ấn nút Xác nhận, hồ sơ sẽ được tạo và lưu trữ trên blockchain.",
								icon: "warning",
								showCancelButton: true,
								confirmButtonText: "Xác nhận",
								cancelButtonText: "Hủy",
								confirmButtonColor: "#3085d6",
								cancelButtonColor: "#d33",
							}).then((result) => {
								if (result.isConfirmed) {
									handleSubmit();
								}
							});
						}}
						className="p-6 space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Chọn bệnh nhân *
							</label>
							<select
								required
								value={formData.patientId}
								onChange={(e) =>
									setFormData({
										...formData,
										patientId: e.target.value,
									})
								}
								disabled={loadingPatients}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50">
								<option value="">
									{loadingPatients
										? "Đang tải..."
										: "-- Chọn bệnh nhân --"}
								</option>
								{patients.map((patient) => (
									<option
										key={patient._id}
										value={patient._id}>
										{patient.name} -{" "}
										{patient.walletAddress ||
											"0xa1b2c3d4e5f60718293a4b5c6d7e8f901234abcd"}
									</option>
								))}
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Chẩn đoán *
							</label>
							<input
								type="text"
								required
								value={formData.diagnosis}
								onChange={(e) =>
									setFormData({
										...formData,
										diagnosis: e.target.value,
									})
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Phương pháp điều trị
							</label>
							<textarea
								rows="2"
								value={formData.treatment}
								onChange={(e) =>
									setFormData({
										...formData,
										treatment: e.target.value,
									})
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Thuốc kê đơn
							</label>
							<textarea
								rows="2"
								value={formData.medication}
								onChange={(e) =>
									setFormData({
										...formData,
										medication: e.target.value,
									})
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Ghi chú của bác sĩ
							</label>
							<textarea
								rows="3"
								value={formData.doctorNote}
								onChange={(e) =>
									setFormData({
										...formData,
										doctorNote: e.target.value,
									})
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Ngày tái khám
							</label>
							<input
								type="date"
								value={formData.dateBack}
								onChange={(e) =>
									setFormData({
										...formData,
										dateBack: e.target.value,
									})
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							/>
						</div>
						<p className="text-sm text-gray-500">
							Bạn sẽ ký thông điệp này để xác nhận và lưu trữ hồ
							sơ vào blockchain một cách an toàn vào lúc{" "}
							{`${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}`}{" "}
							{formatDateTime(new Date())}.
						</p>

						<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
							<button
								type="button"
								onClick={onClose}
								disabled={loading}
								className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
								Hủy
							</button>
							<button
								type="submit"
								disabled={loading || !formData.patientId}
								className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
								{loading ? "Đang tạo..." : "Tạo hồ sơ"}
							</button>
						</div>
					</form>
				</div>
			</div>
		);
	};

	const RecordDetailModal = ({ record, isOpen, onClose }) => {
		if (!isOpen || !record) return null;

		return (
			<div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
					<div className="p-6 border-b border-gray-200">
						<div className="flex items-center justify-between">
							<h2 className="text-xl font-semibold text-gray-900">
								Chi tiết hồ sơ y tế
							</h2>
							<div className="flex items-center space-x-2">
								<Shield className="w-5 h-5 text-green-600" />
								<span className="text-sm text-green-600">
									Block #{record.blockIndex}
								</span>
							</div>
						</div>
					</div>

					<div className="p-6 space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<h3 className="text-sm font-medium text-gray-700 mb-1">
									Bệnh nhân
								</h3>
								<p className="text-gray-900">
									{record.patientId.name}
								</p>
								<p className="text-sm text-gray-500">
									{record.patientId.phoneNumber}
								</p>
							</div>
							<div>
								<h3 className="text-sm font-medium text-gray-700 mb-1">
									Ngày khám
								</h3>
								<p className="text-gray-900">
									{formatDate(record.createdAt)}
								</p>
							</div>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-700 mb-1">
								Chẩn đoán
							</h3>
							<p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
								{record.diagnosis}
							</p>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-700 mb-1">
								Phương pháp điều trị
							</h3>
							<p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
								{record.treatment}
							</p>
						</div>

						<div>
							<h3 className="text-sm font-medium text-gray-700 mb-1">
								Thuốc kê đơn
							</h3>
							<p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
								{record.medication}
							</p>
						</div>

						{record.doctorNote && (
							<div>
								<h3 className="text-sm font-medium text-gray-700 mb-1">
									Ghi chú của bác sĩ
								</h3>
								<p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
									{record.doctorNote}
								</p>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<h3 className="text-sm font-medium text-gray-700 mb-1">
									Trạng thái
								</h3>
								<span
									className={`px-3 py-1 rounded-full text-sm ${
										record.status === "completed"
											? "bg-green-100 text-green-800"
											: "bg-yellow-100 text-yellow-800"
									}`}>
									{getStatusText(record.status)}
								</span>
							</div>
							<div>
								<h3 className="text-sm font-medium text-gray-700 mb-1">
									Ngày tái khám
								</h3>
								<p className="text-gray-900">
									{record.dateBack
										? formatDate(record.dateBack)
										: "Không có"}
								</p>
							</div>
						</div>

						<div className="bg-blue-50 p-4 rounded-lg">
							<div className="flex items-center space-x-2 mb-2">
								<Shield className="w-5 h-5 text-blue-600" />
								<h3 className="text-sm font-medium text-blue-900">
									Thông tin Blockchain
								</h3>
							</div>
							<div className="space-y-1 text-sm">
								<p className="text-blue-800">
									Block Index: #{record.blockIndex}
								</p>
								<p className="text-blue-800">
									Hash: {record.blockchainHash}
								</p>
								<div className="flex items-center space-x-1 mt-2">
									<CheckCircle className="w-4 h-4 text-green-600" />
									<span className="text-green-700">
										Đã được xác thực trên blockchain
									</span>
								</div>
							</div>
						</div>
					</div>

					<div className="p-6 border-t border-gray-200 flex justify-end">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
							Đóng
						</button>
					</div>
				</div>
			</div>
		);
	};

	const PatientDetailModal = ({ patient, isOpen, onClose }) => {
		if (!isOpen || !patient) return null;

		const patientRecords = records.filter(
			(r) => r.patientId._id === patient._id
		);

		return (
			<div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
				<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
					<div className="p-6 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-900">
							Thông tin bệnh nhân
						</h2>
					</div>

					<div className="p-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
							<div className="md:col-span-1">
								<div className="bg-blue-50 p-4 rounded-lg">
									<div className="flex items-center space-x-3 mb-3">
										<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
											<User className="w-8 h-8 text-blue-600" />
										</div>
										<div>
											<h3 className="font-medium text-gray-900">
												{patient.name}
											</h3>
											<p className="text-sm text-gray-500">
												{(
													patient.walletAddress ||
													"0xa1b2c3d4e5f60718293a4b5c6d7e8f901234abcd"
												).substring(0, 20)}
											</p>
										</div>
									</div>
									<div className="space-y-2 text-sm">
										<p>
											<span className="font-medium">
												ID:
											</span>{" "}
											{patient._id}
										</p>
										<p>
											<span className="font-medium">
												SĐT:
											</span>{" "}
											{patient.phoneNumber}
										</p>
										<p>
											<span className="font-medium">
												Tổng hồ sơ:
											</span>{" "}
											{patientRecords.length}
										</p>
									</div>
								</div>
							</div>

							<div className="md:col-span-2">
								<h3 className="text-lg font-medium text-gray-900 mb-3">
									Lịch sử khám bệnh
								</h3>
								<div className="space-y-3 max-h-96 overflow-y-auto">
									{patientRecords.map((record) => (
										<div
											key={record._id}
											className="bg-gray-50 p-3 rounded-lg">
											<div className="flex justify-between items-start">
												<div className="flex-1">
													<h4 className="font-medium text-gray-900">
														{record.diagnosis}
													</h4>
													<p className="text-sm text-gray-600 mt-1">
														{record.treatment}
													</p>
													<p className="text-xs text-gray-500 mt-1">
														{formatDate(
															record.createdAt
														)}
													</p>
												</div>
												<span
													className={`px-2 py-1 rounded-full text-xs ${
														record.status ===
														"completed"
															? "bg-green-100 text-green-800"
															: "bg-yellow-100 text-yellow-800"
													}`}>
													{getStatusText(
														record.status
													)}
												</span>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					<div className="p-6 border-t border-gray-200 flex justify-end">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
							Đóng
						</button>
					</div>
				</div>
			</div>
		);
	};

	const handleViewRecord = (record) => {
		setSelectedRecord(record);
		setShowDetailRecord(true);
	};

	const handleEditRecord = (record) => {
		setSelectedRecord(record);
		setIsEditing(true);
	};

	const handleCancel = () => {
		setSelectedRecord(null);
		setIsEditing(false);
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
		fetchRecordByDoctor();
		fetchUpcomingAppointments();
		setIsEditing(false);
	};

	const handleVerifyRecord = (record) => {
		alert(
			`Xác thực blockchain cho hồ sơ "${record.diagnosis}"\nBlock #${record.blockIndex}\nHash: ${record.blockchainHash}\nTrạng thái: Hợp lệ ✓`
		);
	};

	const handleViewPatient = (patient) => {
		setSelectedPatientDetail(patient);
		setShowPatientDetail(true);
	};

	const handleVerifyBlockchain = () => {
		try {
			Swal.fire({
				icon: "success",
				title: "Xác thực thành công",
				text: `Blockchain đã được xác thực thành công với ${blockchainStats.integrityPercentage}% tính toàn vẹn.`,
			});
		} catch (error) {
			console.error("Error verifying blockchain:", error);
			Swal.fire({
				icon: "error",
				title: "Lỗi",
				text: "Có lỗi xảy ra khi xác thực blockchain!",
			});
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Dashboard Bác sĩ
					</h1>
					<p className="text-gray-600 mt-1">
						Quản lý hồ sơ y tế với công nghệ Blockchain
					</p>
				</div>

				{/* Navigation Tabs */}
				<div className="flex space-x-8 mb-8 border-b border-gray-200">
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
							className={`flex items-center space-x-2 pb-4 border-b-2 transition-colors ${
								activeTab === tab.id
									? "border-blue-600 text-blue-600"
									: "border-transparent text-gray-500 hover:border-blue-600 hover:text-blue-600"
							}`}>
							<tab.icon className="w-5 h-5" />
							<span className="font-medium">{tab.label}</span>
						</button>
					))}
				</div>

				{/* Dashboard Tab */}
				{activeTab === "dashboard" && (
					<div className="space-y-8">
						{/* Stats Cards */}
						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							<StatCard
								icon={Users}
								title="Tổng bệnh nhân"
								value={patients.length}
								subtitle="Đang theo dõi"
								color="blue"
							/>
							<StatCard
								icon={FileText}
								title="Hồ sơ y tế"
								value={records.length}
								subtitle="Đã tạo"
								color="green"
							/>
							<StatCard
								icon={Calendar}
								title="Lịch hẹn sắp tới"
								value={upcomingAppointments.length}
								subtitle="Tuần này"
								color="orange"
							/>
							<StatCard
								icon={Shield}
								title="Blockchain"
								value={`${blockchainStats.integrityPercentage}%`}
								subtitle="Tính toàn vẹn"
								color="purple"
							/>
						</div>

						{/* Quick Actions */}
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
							<h2 className="text-lg font-semibold text-gray-900 mb-4">
								Thao tác nhanh
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<button
									onClick={() => setShowCreateForm(true)}
									className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
									<Plus className="w-6 h-6 text-blue-600" />
									<div className="text-left">
										<p className="font-medium text-blue-900">
											Tạo hồ sơ mới
										</p>
										<p className="text-sm text-blue-600">
											Thêm hồ sơ bệnh nhân
										</p>
									</div>
								</button>

								<button
									onClick={() => setActiveTab("appointments")}
									className="flex items-center space-x-3 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
									<Calendar className="w-6 h-6 text-orange-600" />
									<div className="text-left">
										<p className="font-medium text-orange-900">
											Xem lịch hẹn
										</p>
										<p className="text-sm text-orange-600">
											{upcomingAppointments.length} cuộc
											hẹn
										</p>
									</div>
								</button>

								<button
									onClick={handleVerifyBlockchain}
									className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
									<Shield className="w-6 h-6 text-purple-600" />
									<div className="text-left">
										<p className="font-medium text-purple-900">
											Xác thực Blockchain
										</p>
										<p className="text-sm text-purple-600">
											Kiểm tra tính toàn vẹn
										</p>
									</div>
								</button>
							</div>
						</div>

						{/* Recent Records and Upcoming Appointments */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<div>
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Hồ sơ gần đây
								</h2>
								<div className="space-y-4">
									{records.slice(0, 3).map((record) => (
										<RecordCard
											key={record._id}
											record={record}
										/>
									))}
									{records.length > 3 && (
										<button
											onClick={() =>
												setActiveTab("records")
											}
											className="w-full text-center py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
											Xem tất cả {records.length} hồ sơ
										</button>
									)}
								</div>
							</div>

							<div>
								<h2 className="text-xl font-semibold text-gray-900 mb-4">
									Lịch hẹn sắp tới
								</h2>
								<div className="space-y-4">
									{upcomingAppointments.length > 0 ? (
										upcomingAppointments.map(
											(appointment) => (
												<AppointmentCard
													key={appointment._id}
													appointment={appointment}
												/>
											)
										)
									) : (
										<div className="text-center py-8 text-gray-500">
											<Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
											<p>Không có lịch hẹn nào sắp tới</p>
										</div>
									)}
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
								className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors">
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
									placeholder="Tìm kiếm theo tên, chẩn đoán, thuốc..."
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
							{filteredRecords.length > 0 ? (
								filteredRecords.map((record) => (
									<RecordCard
										key={record._id}
										record={record}
									/>
								))
							) : (
								<div className="text-center py-12 text-gray-500">
									<FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
									<p className="text-lg">
										Không tìm thấy hồ sơ nào
									</p>
									<p className="text-sm">
										Thử thay đổi từ khóa tìm kiếm hoặc bộ
										lọc
									</p>
								</div>
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

						{patients.length > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{patients.map((patient) => (
									<PatientCard
										key={patient._id}
										patient={patient}
									/>
								))}
							</div>
						) : (
							<div className="text-center py-12 text-gray-500">
								<Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
								<p className="text-lg">Chưa có bệnh nhân nào</p>
								<p className="text-sm">
									Tạo hồ sơ y tế đầu tiên để bắt đầu
								</p>
							</div>
						)}
					</div>
				)}

				{/* Appointments Tab */}
				{activeTab === "appointments" && (
					<div className="space-y-6">
						<h2 className="text-2xl font-semibold text-gray-900">
							Lịch hẹn tái khám
						</h2>

						{upcomingAppointments.length > 0 ? (
							<div className="space-y-4">
								{upcomingAppointments.map((appointment) => (
									<AppointmentCard
										key={appointment._id}
										appointment={appointment}
									/>
								))}
							</div>
						) : (
							<div className="text-center py-12 text-gray-500">
								<Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
								<p className="text-lg">
									Không có lịch hẹn nào sắp tới
								</p>
								<p className="text-sm">
									Các lịch hẹn tái khám sẽ hiển thị ở đây
								</p>
							</div>
						)}
					</div>
				)}

				{/* Blockchain Tab */}
				{activeTab === "blockchain" && <BlockchainTab />}
			</div>

			{/* Modals */}
			<CreateMedicalRecordModal
				isOpen={showCreateForm}
				onClose={() => setShowCreateForm(false)}
			/>

			<RecordDetailModal
				record={selectedRecord}
				isOpen={showDetailRecord}
				onClose={() => setShowDetailRecord(false)}
			/>

			<PatientDetailModal
				patient={selectedPatientDetail}
				isOpen={showPatientDetail}
				onClose={() => setShowPatientDetail(false)}
			/>

			{isEditing && selectedRecord && (
				<MedicalRecordEditor
					record={selectedRecord}
					onSave={handleSave}
					onCancel={handleCancel}
				/>
			)}
		</div>
	);
};

export default DoctorDashboard;
