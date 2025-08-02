import {
	Calendar,
	FileText,
	MessageSquare,
	Phone,
	Pill,
	Save,
	Stethoscope,
	User,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiUpdateMedicalRecord } from "../../apis/record";

const MedicalRecordEditor = ({ record, onSave, onCancel, isOpen = true }) => {
	const [formData, setFormData] = useState({
		diagnosis: "",
		treatment: "",
		medication: "",
		doctorNote: "",
		dateBack: "",
		status: "",
	});
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState({});

	// Handle ESC key to close modal
	useEffect(() => {
		const handleEscKey = (event) => {
			if (event.key === "Escape") {
				onCancel();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscKey);
			// Prevent body scroll when modal is open
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscKey);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onCancel]);

	// Handle click outside modal to close
	const handleOverlayClick = (e) => {
		if (e.target === e.currentTarget) {
			onCancel();
		}
	};

	useEffect(() => {
		if (record) {
			setFormData({
				diagnosis: record.diagnosis || "",
				treatment: record.treatment || "",
				medication: record.medication || "",
				doctorNote: record.doctorNote || "",
				dateBack: record.dateBack
					? new Date(record.dateBack).toISOString().split("T")[0]
					: "",
				status: record.status || "ongoing",
			});
		}
	}, [record]);

	const handleInputChange = (field, value) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Clear error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({
				...prev,
				[field]: "",
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.diagnosis.trim()) {
			newErrors.diagnosis = "Chẩn đoán là bắt buộc";
		}

		if (formData.dateBack && new Date(formData.dateBack) < new Date()) {
			newErrors.dateBack = "Ngày hẹn tái khám không thể trong quá khứ";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		setLoading(true);

		try {
			const updateData = {
				diagnosis: formData.diagnosis,
				treatment: formData.treatment,
				medication: formData.medication,
				doctorNote: formData.doctorNote,
				dateBack: formData.dateBack || null,
				status: formData.status,
			};

			const response = await apiUpdateMedicalRecord(
				record._id,
				updateData
			);

			if (response.success) {
				onSave(response.data);
			} else {
				setErrors({
					submit:
						response.message || "Có lỗi xảy ra khi cập nhật hồ sơ",
				});
			}
		} catch (error) {
			console.error("Error updating medical record:", error);
			setErrors({ submit: "Lỗi kết nối. Vui lòng thử lại." });
		} finally {
			setLoading(false);
		}
	};

	if (!record || !isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 bg-black/30 bg-opacity-50 flex items-center justify-center z-50 p-4"
			onClick={handleOverlayClick}>
			<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
				<div className="p-6">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
							<FileText className="w-6 h-6 text-blue-600" />
							Chỉnh sửa hồ sơ y tế
						</h2>
						<button
							onClick={onCancel}
							className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1 rounded-full hover:bg-gray-100"
							title="Đóng">
							<X className="w-6 h-6" />
						</button>
					</div>

					{/* Patient Info Display */}
					<div className="bg-gray-50 p-4 rounded-lg mb-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="flex items-center gap-2">
								<User className="w-4 h-4 text-gray-600" />
								<span className="font-medium">Bệnh nhân:</span>
								<span>{record.patientId?.name}</span>
							</div>
							<div className="flex items-center gap-2">
								<Phone className="w-4 h-4 text-gray-600" />
								<span className="font-medium">Số điện thoại:</span>
								<span>{record.patientId?.phoneNumber}</span>
							</div>
							<div className="flex items-center gap-2">
								<Stethoscope className="w-4 h-4 text-gray-600" />
								<span className="font-medium">Bác sĩ:</span>
								<span>{record.doctorId?.name}</span>
							</div>
						</div>
					</div>

					<div className="space-y-6">
						{/* Diagnosis */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Chẩn đoán *
							</label>
							<textarea
								value={formData.diagnosis}
								onChange={(e) =>
									handleInputChange(
										"diagnosis",
										e.target.value
									)
								}
								className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
									errors.diagnosis
										? "border-red-500"
										: "border-gray-300"
								}`}
								rows="3"
								placeholder="Nhập chẩn đoán..."
							/>
							{errors.diagnosis && (
								<p className="text-red-500 text-sm mt-1">
									{errors.diagnosis}
								</p>
							)}
						</div>

						{/* Treatment */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Phương pháp điều trị
							</label>
							<textarea
								value={formData.treatment}
								onChange={(e) =>
									handleInputChange(
										"treatment",
										e.target.value
									)
								}
								className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								rows="3"
								placeholder="Nhập phương pháp điều trị..."
							/>
						</div>

						{/* Medication */}
						<div>
							<label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
								<Pill className="w-4 h-4" />
								Thuốc điều trị
							</label>
							<textarea
								value={formData.medication}
								onChange={(e) =>
									handleInputChange(
										"medication",
										e.target.value
									)
								}
								className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								rows="3"
								placeholder="Nhập danh sách thuốc và liều dùng..."
							/>
						</div>

						{/* Doctor Note */}
						<div>
							<label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
								<MessageSquare className="w-4 h-4" />
								Ghi chú của bác sĩ
							</label>
							<textarea
								value={formData.doctorNote}
								onChange={(e) =>
									handleInputChange(
										"doctorNote",
										e.target.value
									)
								}
								className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								rows="3"
								placeholder="Nhập ghi chú thêm..."
							/>
						</div>

						{/* Date Back */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
									<Calendar className="w-4 h-4" />
									Ngày hẹn tái khám
								</label>
								<input
									type="date"
									value={formData.dateBack}
									onChange={(e) =>
										handleInputChange(
											"dateBack",
											e.target.value
										)
									}
									className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
										errors.dateBack
											? "border-red-500"
											: "border-gray-300"
									}`}
									min={new Date().toISOString().split("T")[0]}
								/>
								{errors.dateBack && (
									<p className="text-red-500 text-sm mt-1">
										{errors.dateBack}
									</p>
								)}
							</div>

							{/* Status */}
							<div>
								<label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
									<Save className="w-4 h-4" />
									Trạng thái hồ sơ
								</label>
								<select
									value={formData.status}
									onChange={(e) =>
										handleInputChange(
											"status",
											e.target.value
										)
									}
									className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
										errors.status
											? "border-red-500"
											: "border-gray-300"
									}`}>
									{[
										{
											value: "completed",
											label: "Đã hoàn thành",
										},
										{
											value: "ongoing",
											label: "Đang theo dõi",
										},
									].map((option) => (
										<option
											key={option.value}
											value={option.value}>
											{option.label}
										</option>
									))}
								</select>
								{errors.status && (
									<p className="text-red-500 text-sm mt-1">
										{errors.status}
									</p>
								)}
							</div>
						</div>

						{/* Error Message */}
						{errors.submit && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<p className="text-red-700">{errors.submit}</p>
							</div>
						)}

						{/* Action Buttons */}
						<div className="flex gap-4 pt-6 border-t">
							<button
								onClick={handleSubmit}
								disabled={loading}
								className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
								<Save className="w-4 h-4" />
								{loading ? "Đang lưu..." : "Lưu thay đổi"}
							</button>

							<button
								onClick={onCancel}
								className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer">
								<X className="w-4 h-4" />
								Hủy
							</button>
						</div>
					</div>

					{/* Record Info */}
					<div className="mt-6 pt-6 border-t text-sm text-gray-600">
						<p>
							Tạo lúc:{" "}
							{new Date(record.createdAt).toLocaleString("vi-VN")}
						</p>
						{record.updatedAt !== record.createdAt && (
							<p>
								Cập nhật lần cuối:{" "}
								{new Date(record.updatedAt).toLocaleString(
									"vi-VN"
								)}
							</p>
						)}
						{record.blockIndex !== undefined && (
							<p>Block Index: {record.blockIndex}</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default MedicalRecordEditor;
