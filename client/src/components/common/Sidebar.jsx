import {
   Activity,
   Database,
   FileText,
   LogOut,
   Settings,
   Shield,
   User,
   Users
} from "lucide-react";
const Sidebar = ({ activeTab, setActiveTab, handleLogout }) => (
	<div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen fixed left-0 top-0 shadow-2xl">
		<div className="p-6 border-b border-blue-700">
			<div className="flex items-center space-x-3">
				<div className="bg-blue-500 p-2 rounded-lg">
					<Shield className="w-8 h-8" />
				</div>
				<div>
					<h1 className="text-xl font-bold">MedChain</h1>
					<p className="text-blue-200 text-sm">
						Blockchain Healthcare
					</p>
				</div>
			</div>
		</div>

		<nav className="mt-8">
			{[
				{ id: "dashboard", label: "Dashboard", icon: Activity },
				{ id: "patients", label: "Bệnh nhân", icon: Users },
				{ id: "records", label: "Hồ sơ y tế", icon: FileText },
				{ id: "blockchain", label: "Blockchain", icon: Database },
				{ id: "settings", label: "Cài đặt", icon: Settings },
			].map((item) => (
				<button
					key={item.id}
					onClick={() => setActiveTab(item.id)}
					className={`w-full flex items-center space-x-3 px-6 py-4 text-left hover:bg-blue-700 transition-all duration-200 ${
						activeTab === item.id
							? "bg-blue-600 border-r-4 border-blue-300"
							: ""
					}`}>
					<item.icon className="w-5 h-5" />
					<span>{item.label}</span>
				</button>
			))}
		</nav>

		<div className="absolute bottom-6 left-6 right-6">
			<div className="bg-blue-800 rounded-lg p-4 border border-blue-600">
				<div className="flex items-center space-x-3 mb-3">
					<User className="w-10 h-10 bg-blue-600 rounded-full p-2" />
					<div>
						<p className="font-semibold">Dr. Nguyễn Văn A</p>
						<p className="text-blue-200 text-sm">
							Bác sĩ chuyên khoa
						</p>
					</div>
				</div>
				<button
					onClick={handleLogout}
					className="flex items-center space-x-2 text-blue-200 hover:text-white transition-colors">
					<LogOut className="w-4 h-4" />
					<span className="text-sm">Đăng xuất</span>
				</button>
			</div>
		</div>
	</div>
);
export default Sidebar;
