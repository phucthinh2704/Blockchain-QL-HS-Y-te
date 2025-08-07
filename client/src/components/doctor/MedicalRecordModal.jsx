import { X, FileText, User, Calendar, Stethoscope, Pill, ClipboardList, Clock, Shield, Hash, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/dateUtils';

const MedicalRecordModal = ({ record, isOpen, onClose }) => {
	if (!isOpen || !record) return null;
   console.log(record);

	const getStatusBadge = (status) => {
		const colors = {
			completed: "bg-green-100 text-green-800",
			ongoing: "bg-yellow-100 text-yellow-800",
		};
		const labels = {
			completed: "Đã hoàn thành",
			ongoing: "Đang theo dõi",
		};
		return (
			<span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
				{labels[status]}
			</span>
		);
	};

	return (
		<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b border-gray-200">
					<div className="flex items-center space-x-3">
						<FileText className="w-6 h-6 text-blue-600" />
						<h3 className="text-lg font-semibold text-gray-900">
							Chi tiết hồ sơ y tế
						</h3>
					</div>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors">
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-8">
					{/* Diagnosis Section */}
					<div className="bg-blue-50 rounded-lg p-4">
						<div className="flex items-center space-x-2 mb-3">
							<Stethoscope className="w-5 h-5 text-blue-600" />
							<h4 className="text-lg font-semibold text-blue-800">Chẩn đoán</h4>
						</div>
						<p className="text-gray-900 text-lg font-medium">{record.diagnosis}</p>
						<div className="mt-2">
							{getStatusBadge(record.status)}
						</div>
					</div>

					{/* Patient & Doctor Info */}
					<div className="grid md:grid-cols-2 gap-6">
						{/* Patient Info */}
						<div className="bg-green-50 rounded-lg p-4">
							<div className="flex items-center space-x-2 mb-3">
								<User className="w-5 h-5 text-green-600" />
								<h4 className="font-semibold text-green-800">Thông tin bệnh nhân</h4>
							</div>
							<div className="space-y-2">
								<p className="font-medium text-gray-900">{record.patientId?.name || 'Chưa có tên'}</p>
								<p className="text-sm text-gray-600">{record.patientId?.email || record.patientId?.walletAddress}</p>
								{record.patientId?.phoneNumber && (
									<p className="text-sm text-gray-600">SĐT: {record.patientId.phoneNumber}</p>
								)}
							</div>
						</div>

						{/* Doctor Info */}
						<div className="bg-purple-50 rounded-lg p-4">
							<div className="flex items-center space-x-2 mb-3">
								<Stethoscope className="w-5 h-5 text-purple-600" />
								<h4 className="font-semibold text-purple-800">Bác sĩ điều trị</h4>
							</div>
							<div className="space-y-2">
								<p className="font-medium text-gray-900">{record.doctorId?.name || 'Chưa có tên'}</p>
								<p className="text-sm text-gray-600">{record.doctorId?.email || 'Chưa có email'}</p>
							</div>
						</div>
					</div>

					{/* Medical Details */}
					<div className="grid md:grid-cols-2 gap-6">
						{/* Treatment */}
						{record.treatment && (
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<ClipboardList className="w-5 h-5 text-gray-500" />
									<h4 className="font-semibold text-gray-700">Phương pháp điều trị</h4>
								</div>
								<p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{record.treatment}</p>
							</div>
						)}

						{/* Medication */}
						{record.medication && (
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<Pill className="w-5 h-5 text-gray-500" />
									<h4 className="font-semibold text-gray-700">Thuốc kê đơn</h4>
								</div>
								<p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{record.medication}</p>
							</div>
						)}
					</div>

					{/* Doctor Notes */}
					{record.doctorNote && (
						<div className="space-y-3">
							<div className="flex items-center space-x-2">
								<FileText className="w-5 h-5 text-gray-500" />
								<h4 className="font-semibold text-gray-700">Ghi chú của bác sĩ</h4>
							</div>
							<p className="text-gray-900 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">{record.doctorNote}</p>
						</div>
					)}

					{/* Dates Section */}
					<div className="grid md:grid-cols-2 gap-6">
						{/* Created Date */}
						<div className="flex items-center space-x-3">
							<Calendar className="w-5 h-5 text-gray-400" />
							<div>
								<p className="text-sm font-medium text-gray-500">Ngày tạo hồ sơ</p>
								<p className="text-gray-900">{formatDateTime(record.createdAt)}</p>
							</div>
						</div>

						{/* Follow-up Date */}
						{record.dateBack && (
							<div className="flex items-center space-x-3">
								<Clock className="w-5 h-5 text-orange-500" />
								<div>
									<p className="text-sm font-medium text-gray-500">Ngày tái khám</p>
									<p className="text-gray-900 font-medium">{formatDateTime(record.dateBack)}</p>
									{new Date(record.dateBack) > new Date() && (
										<span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
											Sắp tới
										</span>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Blockchain Section */}
					<div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
						<div className="flex items-center space-x-2 mb-4">
							<Shield className="w-5 h-5 text-green-600" />
							<h4 className="font-semibold text-green-800">Thông tin Blockchain</h4>
							<CheckCircle className="w-4 h-4 text-green-500" />
						</div>
						
						<div className="grid md:grid-cols-2 gap-4">
							{/* Blockchain Hash */}
							<div className="space-y-2">
								<p className="text-sm font-medium text-gray-600">Hash Blockchain</p>
								<div className="flex items-center space-x-2">
									<Hash className="w-4 h-4 text-gray-400" />
									<p className="font-mono text-sm text-gray-900 break-all">
										{record.blockchainHash ? 
											`${record.blockchainHash.substring(0, 16)}...${record.blockchainHash.substring(-8)}` 
											: 'Chưa có'
										}
									</p>
								</div>
							</div>

							{/* Block Index */}
							{record.blockIndex !== undefined && (
								<div className="space-y-2">
									<p className="text-sm font-medium text-gray-600">Chỉ số Block</p>
									<p className="font-mono text-lg font-bold text-blue-600">#{record.blockIndex}</p>
								</div>
							)}

							{/* Record Hash */}
							{record.recordHash && (
								<div className="space-y-2 md:col-span-2">
									<p className="text-sm font-medium text-gray-600">Hash Hồ sơ</p>
									<div className="flex items-center space-x-2">
										<Hash className="w-4 h-4 text-gray-400" />
										<p className="font-mono text-sm text-gray-900 break-all">
											{record.recordHash.substring(0, 24)}...{record.recordHash.substring(-12)}
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Verification Status */}
						<div className="mt-4 flex items-center space-x-2 text-green-700">
							<CheckCircle className="w-4 h-4" />
							<span className="text-sm font-medium">Đã được xác thực trên Blockchain</span>
						</div>
					</div>

					{/* Record ID */}
					<div className="border-t pt-4">
						<div className="flex items-center space-x-2 text-gray-500">
							<Hash className="w-4 h-4" />
							<span className="text-sm">ID Hồ sơ: </span>
							<span className="font-mono text-sm">{record._id}</span>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
					<div className="flex items-center space-x-2 text-sm text-gray-500">
						<Calendar className="w-4 h-4" />
						<span>Cập nhật lần cuối: {formatDateTime(record.updatedAt)}</span>
					</div>
					<div className="flex space-x-3">
						<button
							onClick={onClose}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
							Đóng
						</button>
						<button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
							Chỉnh sửa
						</button>
						<button className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
							<Shield className="w-4 h-4 inline mr-1" />
							Xác thực
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default MedicalRecordModal;