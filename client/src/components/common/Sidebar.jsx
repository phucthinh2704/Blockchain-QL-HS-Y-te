import {
	BarChart3,
	Database,
	FileText,
	Shield,
	Users
} from "lucide-react";
import { memo } from "react";
const Sidebar = ({ activeTab, setActiveTab, blockchainStats }) => (
		<div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white shadow-2xl z-30">
			<div className="p-6 border-b border-blue-700">
				<div className="flex items-center space-x-3">
					<div className="bg-white p-2 rounded-lg">
						<Shield className="w-8 h-8 text-blue-600" />
					</div>
					<div>
						<h1 className="text-xl font-bold">MedChain Admin</h1>
						<p className="text-blue-200 text-sm">
							Quản trị hệ thống
						</p>
					</div>
				</div>
			</div>

			<nav className="mt-6">
				{[
					{ id: "dashboard", label: "Dashboard", icon: BarChart3 },
					{ id: "users", label: "Quản lý Người dùng", icon: Users },
					{ id: "records", label: "Hồ sơ Y tế", icon: FileText },
					{ id: "blockchain", label: "Blockchain", icon: Database },
				].map((item) => (
					<button
						key={item.id}
						onClick={() => setActiveTab(item.id)}
						className={`w-full flex items-center space-x-3 px-6 py-4 text-left cursor-pointer hover:bg-blue-700 transition-colors ${
							activeTab === item.id
								? "bg-blue-700 border-r-4 border-white"
								: ""
						}`}>
						<item.icon className="w-5 h-5" />
						<span>{item.label}</span>
					</button>
				))}
			</nav>

			<div className="absolute bottom-6 left-6 right-6">
				<div className="bg-blue-700 rounded-lg p-4">
					<div className="flex items-center space-x-2 mb-2">
						<div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
						<span className="text-sm">Blockchain Active</span>
					</div>
					<p className="text-xs text-blue-200">
						{blockchainStats.totalBlocks} blocks verified
					</p>
					<p className="text-xs text-blue-200">
						{blockchainStats.integrityPercentage}% integrity
					</p>
				</div>
			</div>
		</div>
	);
	export default memo(Sidebar);