import React, { useState, useEffect } from "react";
import {
	X,
	Calendar,
	User,
	FileText,
	Activity,
	Hash,
	Clock,
	UserCheck,
} from "lucide-react";
import { memo } from "react";
import { apiGetDetailBlockByIndex } from "../../apis/blockchain";

const BlockDetailModal = ({
	blockIndex,
	isOpen,
	onClose,
}) => {
	const [block, setBlock] = useState({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		const fetchBlockDetail = async () => {
			if (isOpen && blockIndex) {
				setLoading(true);
				setError(null);
				try {
					const response = await apiGetDetailBlockByIndex(blockIndex);
					setBlock(response.data);
               console.log("Block detail fetched:", response.data);
				} catch (error) {
					console.error("Error fetching block detail:", error);
					setError(error.message);
				} finally {
					setLoading(false);
				}
			}
		};

		fetchBlockDetail();
	}, [isOpen, blockIndex]);

	const formatDate = (dateString) => {
		if (!dateString) return "Không có";
		return new Date(dateString).toLocaleString("vi-VN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getActionColor = (action) => {
		switch (action) {
			case "create":
				return "bg-green-100 text-green-800";
			case "update":
				return "bg-blue-100 text-blue-800";
			case "delete":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getActionText = (action) => {
		switch (action) {
			case "create":
				return "Tạo mới";
			case "update":
				return "Cập nhật";
			case "delete":
				return "Xóa";
			default:
				return action;
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900">
						Chi tiết Block #{blockIndex}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 transition-colors">
						<X size={24} />
					</button>
				</div>

				{/* Content */}
				<div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
					{loading && (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							<span className="ml-2 text-gray-600">
								Đang tải...
							</span>
						</div>
					)}

					{error && (
						<div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
							<div className="text-red-800">{error}</div>
						</div>
					)}

					{block && (
						<div className="space-y-6">
							{/* Block Info */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="bg-gray-50 rounded-lg p-4">
									<div className="flex items-center mb-2">
										<Hash
											className="text-gray-600 mr-2"
											size={18}
										/>
										<h3 className="font-medium text-gray-900">
											Thông tin Block
										</h3>
									</div>
									<div className="space-y-2 text-sm">
										<div>
											<span className="font-medium">
												Index:
											</span>{" "}
											{block.index}
										</div>
										<div>
											<span className="font-medium">
												Hash:
											</span>
											<div className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
												{block.hash}
											</div>
										</div>
										<div>
											<span className="font-medium">
												Previous Hash:
											</span>
											<div className="font-mono text-xs bg-white p-2 rounded mt-1 break-all">
												{block.previousHash}
											</div>
										</div>
									</div>
								</div>

								<div className="bg-gray-50 rounded-lg p-4">
									<div className="flex items-center mb-2">
										<Clock
											className="text-gray-600 mr-2"
											size={18}
										/>
										<h3 className="font-medium text-gray-900">
											Thời gian
										</h3>
									</div>
									<div className="space-y-2 text-sm">
										<div>
											<span className="font-medium">
												Timestamp:
											</span>{" "}
											{formatDate(block.timestamp)}
										</div>
										<div>
											<span className="font-medium">
												Tạo lúc:
											</span>{" "}
											{formatDate(block.createdAt)}
										</div>
										<div>
											<span className="font-medium">
												Cập nhật:
											</span>{" "}
											{formatDate(block.updatedAt)}
										</div>
									</div>
								</div>
							</div>

							{/* Action */}
							<div className="bg-gray-50 rounded-lg p-4">
								<div className="flex items-center mb-3">
									<Activity
										className="text-gray-600 mr-2"
										size={18}
									/>
									<h3 className="font-medium text-gray-900">
										Hành động
									</h3>
								</div>
								<span
									className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getActionColor(
										block.data?.action
									)}`}>
									{getActionText(block.data?.action)}
								</span>
								{block.data?.updatedBy && (
									<div className="mt-2 flex items-center text-sm text-gray-600">
										<UserCheck
											size={16}
											className="mr-1"
										/>
										<span>
											Cập nhật bởi:{" "}
											{block.data?.updatedBy.name} (
											{block.data?.updatedBy.email})
										</span>
									</div>
								)}
							</div>

							{/* Medical Data */}
							<div className="bg-blue-50 rounded-lg p-4">
								<div className="flex items-center mb-3">
									<FileText
										className="text-blue-600 mr-2"
										size={18}
									/>
									<h3 className="font-medium text-gray-900">
										Thông tin y tế
									</h3>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{/* Patient & Doctor */}
									<div className="space-y-3">
										{block.data?.patientId && (
											<div className="bg-white rounded p-3">
												<div className="flex items-center mb-1">
													<User
														className="text-green-600 mr-2"
														size={16}
													/>
													<span className="font-medium text-sm">
														Bệnh nhân
													</span>
												</div>
												<div className="text-sm">
													<div>
														{
															block.data?.patientId
																.name
														}
													</div>
													<div className="text-gray-600">
														{
															block.data?.patientId
																.email
														}
													</div>
												</div>
											</div>
										)}

										{block.data?.doctorId && (
											<div className="bg-white rounded p-3">
												<div className="flex items-center mb-1">
													<User
														className="text-blue-600 mr-2"
														size={16}
													/>
													<span className="font-medium text-sm">
														Bác sĩ
													</span>
												</div>
												<div className="text-sm">
													<div>
														{
															block.data?.doctorId
																.name
														}
													</div>
													<div className="text-gray-600">
														{
															block.data?.doctorId
																.email
														}
													</div>
												</div>
											</div>
										)}
									</div>

									{/* Medical Info */}
									<div className="space-y-3">
										{block.data?.diagnosis && (
											<div className="bg-white rounded p-3">
												<div className="font-medium text-sm mb-1">
													Chẩn đoán
												</div>
												<div className="text-sm text-gray-700">
													{block.data?.diagnosis}
												</div>
											</div>
										)}

										{block.data?.treatment && (
											<div className="bg-white rounded p-3">
												<div className="font-medium text-sm mb-1">
													Điều trị
												</div>
												<div className="text-sm text-gray-700">
													{block.data?.treatment}
												</div>
											</div>
										)}
									</div>
								</div>

								{/* Additional Info */}
								<div className="mt-4 space-y-3">
									{block.data?.medication && (
										<div className="bg-white rounded p-3">
											<div className="font-medium text-sm mb-1">
												Thuốc điều trị
											</div>
											<div className="text-sm text-gray-700">
												{block.data?.medication}
											</div>
										</div>
									)}

									{block.data?.doctorNote && (
										<div className="bg-white rounded p-3">
											<div className="font-medium text-sm mb-1">
												Ghi chú của bác sĩ
											</div>
											<div className="text-sm text-gray-700">
												{block.data?.doctorNote}
											</div>
										</div>
									)}

									{block.data?.dateBack && (
										<div className="bg-white rounded p-3">
											<div className="flex items-center">
												<Calendar
													className="text-orange-600 mr-2"
													size={16}
												/>
												<div>
													<div className="font-medium text-sm">
														Ngày hẹn tái khám
													</div>
													<div className="text-sm text-gray-700">
														{formatDate(
															block.data?.dateBack
														)}
													</div>
												</div>
											</div>
										</div>
									)}
								</div>

								{/* Record ID */}
								{block.data?.recordId && (
									<div className="mt-4 bg-white rounded p-3">
										<div className="font-medium text-sm mb-1">
											ID Hồ sơ y tế
										</div>
										<div className="text-sm text-gray-600 font-mono">
											{block.data?.recordId}
										</div>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="flex justify-end p-6 border-t border-gray-200">
					<button
						onClick={onClose}
						className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
						Đóng
					</button>
				</div>
			</div>
		</div>
	);
};

export default memo(BlockDetailModal);
