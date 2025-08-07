import { X, User, Mail, Calendar, Wallet, Shield } from 'lucide-react';

const UserModal = ({ user, isOpen, onClose }) => {
	if (!isOpen || !user) return null;

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
				className={`px-3 py-1 rounded-full text-sm font-medium ${colors[role]}`}>
				{labels[role]}
			</span>
		);
	};

	const getRoleIcon = (role) => {
		const icons = {
			admin: Shield,
			doctor: User,
			patient: User,
		};
		const IconComponent = icons[role] || User;
		return <IconComponent className="w-5 h-5" />;
	};

	return (
		<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex justify-between items-center p-6 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">
						Thông tin người dùng
					</h3>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors">
						<X className="w-6 h-6" />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">
					{/* Avatar and Name */}
					<div className="text-center">
						<div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
							<User className="w-10 h-10 text-gray-500" />
						</div>
						<h4 className="text-xl font-semibold text-gray-900 mb-2">
							{user.name || 'Chưa có tên'}
						</h4>
						{getRoleBadge(user.role)}
					</div>

					{/* User Details */}
					<div className="space-y-4">
						{/* Email */}
						{user.email && (
							<div className="flex items-center space-x-3">
								<Mail className="w-5 h-5 text-gray-400" />
								<div>
									<p className="text-sm font-medium text-gray-500">Email</p>
									<p className="text-gray-900">{user.email}</p>
								</div>
							</div>
						)}

						{/* Wallet Address */}
						{/* {user.walletAddress && ( */}
							<div className="flex items-center space-x-3">
								<Wallet className="w-5 h-5 text-gray-400" />
								<div>
									<p className="text-sm font-medium text-gray-500">
										Địa chỉ ví
									</p>
									<p className="text-gray-900 font-mono text-sm break-all">
										{user.walletAddress || "0xeb3e92deb43830d9eb18d8b734cdc297ac3c28ef"}
									</p>
								</div>
							</div>
						{/* )} */}

						{/* Role */}
						<div className="flex items-center space-x-3">
							{getRoleIcon(user.role)}
							<div>
								<p className="text-sm font-medium text-gray-500">Vai trò</p>
								<p className="text-gray-900">
									{user.role === 'admin' && 'Quản trị viên'}
									{user.role === 'doctor' && 'Bác sĩ'}
									{user.role === 'patient' && 'Bệnh nhân'}
								</p>
							</div>
						</div>

						{/* Created Date */}
						{user.createdAt && (
							<div className="flex items-center space-x-3">
								<Calendar className="w-5 h-5 text-gray-400" />
								<div>
									<p className="text-sm font-medium text-gray-500">
										Ngày tạo tài khoản
									</p>
									<p className="text-gray-900">
										{new Date(user.createdAt).toLocaleDateString("vi-VN", {
											year: 'numeric',
											month: 'long',
											day: 'numeric',
											hour: '2-digit',
											minute: '2-digit'
										})}
									</p>
								</div>
							</div>
						)}

						{/* User ID */}
						<div className="flex items-center space-x-3">
							<User className="w-5 h-5 text-gray-400" />
							<div>
								<p className="text-sm font-medium text-gray-500">ID người dùng</p>
								<p className="text-gray-900 font-mono text-sm">{user._id}</p>
							</div>
						</div>

						{/* Status */}
						<div className="flex items-center space-x-3">
							<div className="w-5 h-5 flex items-center justify-center">
								<div className="w-3 h-3 bg-green-500 rounded-full"></div>
							</div>
							<div>
								<p className="text-sm font-medium text-gray-500">Trạng thái</p>
								<p className="text-green-600 font-medium">Hoạt động</p>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
						Đóng
					</button>
					<button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
						Chỉnh sửa
					</button>
				</div>
			</div>
		</div>
	);
};

export default UserModal;