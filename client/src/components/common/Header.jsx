// components/Header.js
import React, { useState } from "react";
import useAuth from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Activity, User, LogOut, Settings, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";

const Header = () => {
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [showDropdown, setShowDropdown] = useState(false);

	const handleLogout = () => {
		Swal.fire({
			title: "Đăng xuất",
			text: "Bạn có chắc chắn muốn đăng xuất?",
			icon: "question",
			showCancelButton: true,
			confirmButtonColor: "#3085d6",
			cancelButtonColor: "#d33",
			confirmButtonText: "Đăng xuất",
			cancelButtonText: "Hủy",
		}).then(async (result) => {
			if (result.isConfirmed) {
				const logoutSuccess = await logout();
				if (logoutSuccess) {
					Swal.fire({
						title: "Đã đăng xuất!",
						text: "Bạn đã đăng xuất thành công.",
						icon: "success",
						timer: 1000,
						showConfirmButton: false,
					}).then(() => {
						navigate("/login");
					});
				}
			}
		});
	};

	const handleProfileClick = () => {
		setShowDropdown(false);
		navigate("/", { state: { activeTab: "profile" } });
	};

	const handleMedicalClick = () => {
		setShowDropdown(false);
		navigate("/", { state: { activeTab: "medical-records" } });
	};

	return (
		<header className="bg-white shadow-sm border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<div className="flex items-center">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
									<Activity className="w-6 h-6 text-white" />
								</div>
							</div>
							<div className="ml-3">
								<h1 className="text-xl font-bold text-gray-900">
									HealthCare
								</h1>
							</div>
						</div>
					</div>

					{/* User Menu */}
					<div className="flex items-center">
						<div className="relative">
							<button
								onClick={() => setShowDropdown(!showDropdown)}
								className="flex items-center cursor-pointer space-x-3 p-2 rounded-lg hover:bg-blue-200 transition-colors duration-200">
								<div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
									<User className="w-5 h-5 text-blue-600" />
								</div>
								<div className="hidden md:block text-left">
									<p className="text-sm font-medium text-gray-900">
										{user?.role === "doctor" ? "BS. " : ""} {user?.name || "Người dùng"}
									</p>
									<p className="text-xs text-gray-500">
										{user?.email || "user@example.com"}
									</p>
								</div>
								<ChevronDown
									className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
										showDropdown ? "rotate-180" : ""
									}`}
								/>
							</button>

							{/* Dropdown Menu */}
							{showDropdown && (
								<div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
									<div className="py-1">
										<div className="px-4 py-3 border-b border-gray-100">
											<p className="text-sm font-medium text-gray-900">
												{user?.name || "Người dùng"}
											</p>
											<p className="text-xs text-gray-500 truncate">
												{user?.email ||
													"user@example.com"}
											</p>
										</div>

										<button
											onClick={handleMedicalClick}
											className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
											<Activity className="w-4 h-4 mr-3 text-gray-500" />
											Hồ sơ y tế
										</button>

										<button
											onClick={handleProfileClick}
											className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
											<User className="w-4 h-4 mr-3 text-gray-500" />
											Hồ sơ cá nhân
										</button>

										<div className="border-t border-gray-100">
											<button
												onClick={handleLogout}
												className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-100 transition-colors duration-200 cursor-pointer">
												<LogOut className="w-4 h-4 mr-3" />
												Đăng xuất
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Overlay to close dropdown when clicking outside */}
			{showDropdown && (
				<div
					className="fixed inset-0 z-40"
					onClick={() => setShowDropdown(false)}
				/>
			)}
		</header>
	);
};

export default Header;
