import {
   Bell,
   Search
} from "lucide-react";
const AdminHeader = ({
	activeTab,
	searchTerm,
	setSearchTerm,
	medicalRecords,
}) => (
	<div className="ml-64 bg-white shadow-sm border-b border-gray-200 px-6 py-4">
		<div className="flex items-center justify-between">
			<div>
				<h2 className="text-2xl font-bold text-gray-800">
					{activeTab === "dashboard" && "Admin Dashboard"}
					{activeTab === "users" && "Quản lý Người dùng"}
					{activeTab === "records" && "Quản lý Hồ sơ Y tế"}
					{activeTab === "blockchain" && "Blockchain Management"}
				</h2>
				<p className="text-gray-600">
					{activeTab === "dashboard" &&
						"Tổng quan hệ thống quản lý y tế"}
					{activeTab === "users" &&
						"Quản lý tài khoản bác sĩ, bệnh nhân, admin"}
					{activeTab === "records" &&
						"Giám sát và quản lý hồ sơ bệnh án"}
					{activeTab === "blockchain" &&
						"Kiểm tra tính toàn vẹn blockchain"}
				</p>
			</div>

			<div className="flex items-center space-x-4">
				<div className="relative">
					<Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
					<input
						type="text"
						placeholder="Tìm kiếm..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10 pr-4 py-2 outline-none border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</div>
				<button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
					<Bell className="w-6 h-6" />
					<span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
						{
							medicalRecords.filter(
								(r) =>
									r.dateBack &&
									new Date(r.dateBack) <=
										new Date(
											Date.now() + 7 * 24 * 60 * 60 * 1000
										)
							).length
						}
					</span>
				</button>
			</div>
		</div>
	</div>
);
export default AdminHeader;
