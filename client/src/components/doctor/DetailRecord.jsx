import {
	X,
	User,
	Calendar,
	FileText,
	Pill,
	Stethoscope,
	Clock,
	Shield,
	Activity,
	MapPin,
	Phone,
	Mail,
} from "lucide-react";
import moment from "moment";
import { useState, useEffect, useCallback } from "react";
import { apiGetRecordHistory } from "../../apis/record";
import Swal from "sweetalert2";
import useAuth from "../../hooks/useAuth";

const DetailRecord = ({ record, isOpen, onClose }) => {
	const [blockchainHistory, setBlockchainHistory] = useState([]);
	const [isLoadingHistory, setIsLoadingHistory] = useState(false);
	const { user } = useAuth();
	const fetchBlockchainHistory = useCallback(async () => {
		setIsLoadingHistory(true);
		try {
			// Thay thế bằng API call thực tế
			// const history = await record.getBlockchainHistory();
			// setBlockchainHistory(history);
			const response = await apiGetRecordHistory(record._id);
			if (!response.success) {
				Swal.fire({
					icon: "error",
					title: "Lỗi",
					text: response.message || "Không thể tải lịch sử giao dịch",
				});
			}
			setBlockchainHistory(response.data.history);
			setIsLoadingHistory(false);
		} catch (error) {
			console.error("Error fetching blockchain history:", error);
			setIsLoadingHistory(false);
		}
	}, [record]);

	useEffect(() => {
		if (isOpen && record) {
			fetchBlockchainHistory();
		}
	}, [fetchBlockchainHistory, isOpen, record]);

	if (!isOpen || !record) return null;

	return (
		<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
							<FileText className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Chi tiết Hồ sơ Y tế
							</h2>
							<p className="text-sm text-gray-500">
								Mã hồ sơ: {record._id}
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				<div className="p-6 space-y-6">
					{/* Patient Information */}
					<div className="bg-gray-50 rounded-lg p-4">
						<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
							<User className="w-5 h-5 mr-2 text-blue-600" />
							Thông tin Bệnh nhân
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="flex items-center space-x-2">
								<User className="w-4 h-4 text-gray-500" />
								<span className="text-sm text-gray-600">
									Họ tên:
								</span>
								<span className="font-medium">
									{record.patientId?.name}
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<Phone className="w-4 h-4 text-gray-500" />
								<span className="text-sm text-gray-600">
									SĐT:
								</span>
								<span className="font-medium">
									{record.patientId?.phoneNumber}
								</span>
							</div>
							<div className="flex items-center space-x-2">
								<Mail className="w-4 h-4 text-gray-500" />
								<span className="text-sm text-gray-600">
									Email:
								</span>
								<span className="font-medium">
									{record.patientId?.email}
								</span>
							</div>
						</div>
					</div>

					{/* Medical Information */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Diagnosis & Treatment */}
						<div className="space-y-4">
							<div className="bg-white border border-gray-200 rounded-lg p-4">
								<h4 className="font-medium text-gray-900 mb-2 flex items-center">
									<Stethoscope className="w-4 h-4 mr-2 text-red-600" />
									Chẩn đoán
								</h4>
								<p className="text-gray-700 bg-red-50 p-3 rounded-lg">
									{record.diagnosis}
								</p>
							</div>

							<div className="bg-white border border-gray-200 rounded-lg p-4">
								<h4 className="font-medium text-gray-900 mb-2 flex items-center">
									<Activity className="w-4 h-4 mr-2 text-green-600" />
									Phương pháp điều trị
								</h4>
								<p className="text-gray-700 bg-green-50 p-3 rounded-lg">
									{record.treatment || "Chưa có thông tin"}
								</p>
							</div>
						</div>

						{/* Medication & Notes */}
						<div className="space-y-4">
							<div className="bg-white border border-gray-200 rounded-lg p-4">
								<h4 className="font-medium text-gray-900 mb-2 flex items-center">
									<Pill className="w-4 h-4 mr-2 text-purple-600" />
									Thuốc điều trị
								</h4>
								<p className="text-gray-700 bg-purple-50 p-3 rounded-lg">
									{record.medication || "Không có thuốc"}
								</p>
							</div>

							<div className="bg-white border border-gray-200 rounded-lg p-4">
								<h4 className="font-medium text-gray-900 mb-2 flex items-center">
									<FileText className="w-4 h-4 mr-2 text-orange-600" />
									Ghi chú của bác sĩ
								</h4>
								<p className="text-gray-700 bg-orange-50 p-3 rounded-lg">
									{record.doctorNote || "Không có ghi chú"}
								</p>
							</div>
						</div>
					</div>

					{/* Dates Information */}
					<div className="bg-blue-50 rounded-lg p-4">
						<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
							<Calendar className="w-5 h-5 mr-2 text-blue-600" />
							Thông tin Lịch hẹn
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="text-center p-3 bg-white rounded-lg">
								<Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
								<p className="text-sm text-gray-600">
									Ngày khám
								</p>
								<p className="font-medium">
									{moment(record.createdAt).format(
										"DD/MM/YYYY HH:mm"
									)}
								</p>
							</div>
							<div className="text-center p-3 bg-white rounded-lg">
								<Calendar className="w-6 h-6 text-green-600 mx-auto mb-2" />
								<p className="text-sm text-gray-600">
									Ngày tái khám
								</p>
								<p className="font-medium text-green-600">
									{record.dateBack
										? moment(record.dateBack).format(
												"DD/MM/YYYY"
										  )
										: "Chưa hẹn"}
								</p>
							</div>
							<div className="text-center p-3 bg-white rounded-lg">
								<Activity className="w-6 h-6 text-purple-600 mx-auto mb-2" />
								<p className="text-sm text-gray-600">
									Cập nhật lần cuối
								</p>
								<p className="font-medium">
									{moment(record.updatedAt).format(
										"DD/MM/YYYY HH:mm"
									)}
								</p>
							</div>
						</div>
					</div>

					{/* Blockchain Information */}
					<div className="bg-gray-50 rounded-lg p-4">
						<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
							<Shield className="w-5 h-5 mr-2 text-green-600" />
							Thông tin Blockchain
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<div className="bg-white p-3 rounded-lg">
								<p className="text-sm text-gray-600">
									Block Index
								</p>
								<p className="font-mono text-sm font-medium">
									#{record.blockIndex || "N/A"}
								</p>
							</div>
							<div className="bg-white p-3 rounded-lg">
								<p className="text-sm text-gray-600">
									Blockchain Hash
								</p>
								<p className="font-mono text-xs font-medium text-green-600 break-all">
									{record.blockchainHash || "Đang tạo..."}
								</p>
							</div>
						</div>

						{/* Blockchain History */}
						<div className="bg-white rounded-lg border border-gray-200 p-4">
							<h4 className="font-medium text-gray-900 mb-3">
								Lịch sử thay đổi
							</h4>
							{isLoadingHistory ? (
								<div className="flex items-center justify-center py-4">
									<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
									<span className="ml-2 text-sm text-gray-600">
										Đang tải...
									</span>
								</div>
							) : (
								<div className="space-y-3">
									{blockchainHistory.map((block, index) => (
										<div
											key={index}
											className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
											<div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
												<Shield className="w-4 h-4 text-green-600" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<p className="text-sm font-medium text-gray-900">
														Block #
														{block.blockIndex} -{" "}
														{block.action.toUpperCase()}
													</p>
													<p className="text-xs text-gray-500">
														{moment(
															block.timestamp
														).format(
															"DD/MM/YYYY HH:mm"
														)}
													</p>
												</div>
												<p className="text-xs text-gray-600 mt-1">
													Bởi:{" "}
													{block.updatedBy?.name ||
														user.name}
												</p>
												<p className="text-xs font-mono text-gray-500 mt-1 break-all">
													Hash: {block.hash}
												</p>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Doctor Information */}
					<div className="bg-green-50 rounded-lg p-4">
						<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
							<Stethoscope className="w-5 h-5 mr-2 text-green-600" />
							Thông tin Bác sĩ
						</h3>
						<div className="flex items-center space-x-4">
							<div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
								<User className="w-6 h-6 text-green-600" />
							</div>
							<div>
								<p className="font-medium text-gray-900">
									{record.doctorId?.name}
								</p>
								<p className="text-sm text-gray-600">
									{record.doctorId?.email}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg">
					<div className="flex justify-end space-x-3">
						<button
							onClick={onClose}
							className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
							Đóng
						</button>
						<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
							In hồ sơ
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default DetailRecord;
