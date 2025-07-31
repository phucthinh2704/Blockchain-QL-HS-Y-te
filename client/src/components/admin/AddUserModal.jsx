import {
   X
} from "lucide-react";
const AddUserModal = ({
	showAddUserModal,
	setShowAddUserModal,
	selectedUser,
	setSelectedUser,
	userFormData,
	setUserFormData,
	handleUserSubmit,
	handleUserInputChange,
	loading,
}) => {
	if (!showAddUserModal) return null;

	const closeModal = () => {
		setShowAddUserModal(false);
		setSelectedUser(null);
		setUserFormData({
			email: "",
			password: "",
			name: "",
			role: "patient",
			phoneNumber: "",
			dateOfBirth: "",
		});
	};

	return (
		<div className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-semibold">
						{selectedUser
							? "Chỉnh sửa người dùng"
							: "Thêm người dùng mới"}
					</h3>
					<button
						onClick={closeModal}
						className="text-gray-500 hover:text-gray-700 cursor-pointer hover:bg-gray-100 rounded-full p-1 transition-colors">
						<X className="w-5 h-5" />
					</button>
				</div>

				<form
					onSubmit={handleUserSubmit}
					className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Họ tên
						</label>
						<input
							type="text"
							name="name"
							value={userFormData.name}
							onChange={handleUserInputChange}
							className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Email
						</label>
						<input
							type="email"
							name="email"
							value={userFormData.email}
							onChange={handleUserInputChange}
							className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Mật khẩu
						</label>
						<input
							type="password"
							name="password"
							value={userFormData.password}
							onChange={handleUserInputChange}
							className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							required={!selectedUser}
							placeholder={
								selectedUser
									? "Để trống nếu không thay đổi"
									: ""
							}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Vai trò
						</label>
						<select
							name="role"
							value={userFormData.role}
							onChange={handleUserInputChange}
							className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
							<option value="patient">Bệnh nhân</option>
							<option value="doctor">Bác sĩ</option>
							<option value="admin">Admin</option>
						</select>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Số điện thoại
						</label>
						<input
							type="tel"
							name="phoneNumber"
							value={userFormData.phoneNumber}
							onChange={handleUserInputChange}
							className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Ngày sinh
						</label>
						<input
							type="date"
							name="dateOfBirth"
							value={
								userFormData.dateOfBirth
									? userFormData.dateOfBirth.split("T")[0]
									: ""
							}
							onChange={handleUserInputChange}
							className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						/>
					</div>

					<div className="flex space-x-3 pt-4">
						<button
							type="submit"
							disabled={loading}
							className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer">
							{loading
								? "Đang xử lý..."
								: selectedUser
								? "Cập nhật"
								: "Tạo người dùng"}
						</button>
						<button
							type="button"
							onClick={closeModal}
							className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
							Hủy
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default AddUserModal;
