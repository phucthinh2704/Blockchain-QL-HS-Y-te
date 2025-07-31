import React from "react";
import { X, User, Mail, Phone, Calendar, Clock, Shield } from "lucide-react";
import { formatDate, formatDateTime } from "../../utils/dateUtils";

const PatientDetailModal = ({ patient, isOpen, onClose }) => {
	if (!isOpen || !patient) return null;

	return (
		<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<div className="flex items-center space-x-3">
						<div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
							<User className="w-6 h-6 text-blue-600" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-900">
								Chi tiết bệnh nhân
							</h2>
							<p className="text-sm text-gray-500">
								Thông tin cá nhân
							</p>
						</div>
					</div>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
						<X className="w-5 h-5 text-gray-500" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Basic Information */}
					<div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="flex items-start space-x-3">
							<User className="w-5 h-5 text-gray-400 mt-0.5" />
							<div className="flex-1">
								<label className="text-sm font-medium text-gray-700">
									Họ và tên
								</label>
								<p className="text-gray-900 font-medium">
									{patient.name}
								</p>
							</div>
						</div>

						<div className="flex items-start space-x-3">
							<Mail className="w-5 h-5 text-gray-400 mt-0.5" />
							<div className="flex-1">
								<label className="text-sm font-medium text-gray-700">
									Email
								</label>
								<p className="text-gray-900">{patient.email}</p>
							</div>
						</div>

						

						<div className="flex items-start space-x-3">
							<Phone className="w-5 h-5 text-gray-400 mt-0.5" />
							<div className="flex-1">
								<label className="text-sm font-medium text-gray-700">
									Số điện thoại
								</label>
								<p className="text-gray-900">
									{patient.phoneNumber || "Chưa cập nhật"}
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-3">
							<Shield className="w-5 h-5 text-gray-400 mt-0.5" />
							<div className="flex-1">
								<label className="text-sm font-medium text-gray-700">
									Vai trò
								</label>
								<span
									className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
										patient.role === "patient"
											? "bg-green-100 text-green-800"
											: patient.role === "doctor"
											? "bg-blue-100 text-blue-800"
											: "bg-purple-100 text-purple-800"
									}`}>
									{patient.role === "patient"
										? "Bệnh nhân"
										: patient.role === "doctor"
										? "Bác sĩ"
										: "Quản trị viên"}
								</span>
							</div>
						</div>
						<div className="flex items-start space-x-3">
							<Mail className="w-5 h-5 text-gray-400 mt-0.5" />
							<div className="flex-1">
								<label className="text-sm font-medium text-gray-700">
									Ngày sinh
								</label>
								<p className="text-gray-900">
									{formatDate(patient.dateOfBirth)}
								</p>
							</div>
						</div>
					</div>

					{/* System Information */}
					<div className="border-t border-gray-200 pt-6">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Thông tin hệ thống
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="flex items-start space-x-3">
								<Clock className="w-5 h-5 text-gray-400 mt-0.5" />
								<div className="flex-1">
									<label className="text-sm font-medium text-gray-700">
										Ngày tạo tài khoản
									</label>
									<p className="text-gray-900">
										{formatDateTime(patient.createdAt)}
									</p>
								</div>
							</div>

							<div className="flex items-start space-x-3">
								<Clock className="w-5 h-5 text-gray-400 mt-0.5" />
								<div className="flex-1">
									<label className="text-sm font-medium text-gray-700">
										Cập nhật gần nhất
									</label>
									<p className="text-gray-900">
										{formatDateTime(patient.updatedAt)}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Patient ID */}
					<div className="bg-gray-50 rounded-lg p-4">
						<label className="text-sm font-medium text-gray-700">
							ID bệnh nhân
						</label>
						<p className="text-gray-900 font-mono text-sm mt-1">
							{patient._id}
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors cursor-pointer">
						Đóng
					</button>
				</div>
			</div>
		</div>
	);
};

export default PatientDetailModal;
