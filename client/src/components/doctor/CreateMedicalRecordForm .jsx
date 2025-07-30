import {
   Calendar,
   ClipboardList,
   FileText,
   Pill,
   Plus,
   Search,
   Stethoscope,
   User,
   X,
} from "lucide-react";
import { memo, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { apiCreateMedicalRecord } from "../../apis/record";
import { apiRegister } from "../../apis/user";

const CreateMedicalRecordForm = ({
	isOpen,
	onClose,
	onSuccess,
	existingPatients = [],
	doctorId,
}) => {
	const [formData, setFormData] = useState({
		patientId: "",
		diagnosis: "",
		treatment: "",
		medication: "",
		doctorNote: "",
		dateBack: "",
	});

	const [newPatientData, setNewPatientData] = useState({
		name: "",
		email: "",
		password: "123456", // Default password for new patients
		phoneNumber: "",
		dateOfBirth: "",
		role: "patient",
	});

	const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errors, setErrors] = useState({});

	// Reset form when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			setFormData({
				patientId: "",
				diagnosis: "",
				treatment: "",
				medication: "",
				doctorNote: "",
				dateBack: "",
			});
			setNewPatientData({
				name: "",
				email: "",
				password: "123456", // Default password for new patients
				phoneNumber: "",
				dateOfBirth: "",
				role: "patient",
			});
			setIsCreatingNewPatient(false);
			setSearchTerm("");
			setErrors({});
		}
	}, [isOpen]);

	// Filter existing patients based on search term
	const filteredPatients = existingPatients.filter(
		(patient) =>
			patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			patient.phoneNumber?.includes(searchTerm) ||
			patient.email?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const validateForm = () => {
		const newErrors = {};

		// Validate patient selection or new patient data
		if (!isCreatingNewPatient && !formData.patientId) {
			newErrors.patientId = "Vui lòng chọn bệnh nhân";
		}

		if (isCreatingNewPatient) {
			if (!newPatientData.name.trim()) {
				newErrors.patientName = "Tên bệnh nhân là bắt buộc";
			}
			if (!newPatientData.phoneNumber.trim()) {
				newErrors.patientPhone = "Số điện thoại là bắt buộc";
			} else if (!/^[0-9]{10,11}$/.test(newPatientData.phoneNumber)) {
				newErrors.patientPhone = "Số điện thoại không hợp lệ";
			}
			if (
				newPatientData.email &&
				!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPatientData.email)
			) {
				newErrors.patientEmail = "Email không hợp lệ";
			}
		}

		// Validate medical record data
		if (!formData.diagnosis.trim()) {
			newErrors.diagnosis = "Chẩn đoán là bắt buộc";
		}

		if (formData.dateBack) {
			const selectedDate = new Date(formData.dateBack);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (selectedDate <= today) {
				newErrors.dateBack = "Ngày hẹn tái khám phải sau ngày hôm nay";
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

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

	const handleNewPatientChange = (field, value) => {
		setNewPatientData((prev) => ({
			...prev,
			[field]: value,
		}));

		// Clear error when user starts typing
		const errorField = `patient${
			field.charAt(0).toUpperCase() + field.slice(1)
		}`;
		if (errors[errorField]) {
			setErrors((prev) => ({
				...prev,
				[errorField]: "",
			}));
		}
	};

	const createNewPatient = async () => {
		try {
			const response = await apiRegister(newPatientData);
         if (!response.success) {
            Swal.fire({
               icon: "error",
               title: "Lỗi",
               text: response.message || "Không thể tạo bệnh nhân mới",
            });
            throw new Error(response.message || "Không thể tạo bệnh nhân mới");
         }
         const patientId = response.data?._id || response.data?.id;
         return patientId;
		} catch (error) {
			console.error("Error creating new patient:", error);
         Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: error.message || "Có lỗi xảy ra khi tạo bệnh nhân mới",
         });
         throw error; // Re-throw to handle in submit handler
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setIsSubmitting(true);

		try {
			let finalPatientId = formData.patientId;

			// Create new patient if needed
			if (isCreatingNewPatient) {
				finalPatientId = await createNewPatient();
			}
         console.log("Final Patient ID:", finalPatientId);
			// Create medical record
			const response = await apiCreateMedicalRecord({
				...formData,
				doctorId,
				patientId: finalPatientId,
			});

			if (!response.success) {
            Swal.fire({
               icon: "error",
               title: "Lỗi",
               text: response.message || "Không thể tạo hồ sơ y tế",
            });
				throw new Error(response.message || "Không thể tạo hồ sơ y tế");
			}

			// Success
			onSuccess();
			onClose();

         Swal.fire({
            icon: "success",
            title: "Thành công",
            text: "Hồ sơ y tế đã được tạo thành công",
         });
		} catch (error) {
			console.error("Error creating medical record:", error);
			Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: error.message || "Có lỗi xảy ra khi tạo hồ sơ y tế",
         });
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-xl font-semibold text-gray-900 flex items-center">
						<FileText className="w-5 h-5 mr-2 text-blue-600" />
						Tạo hồ sơ y tế mới
					</h2>
					<button
						onClick={onClose}
						className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
						disabled={isSubmitting}>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="overflow-y-auto max-h-[calc(90vh-140px)]">
					<div className="p-6 space-y-6">
						{/* Patient Selection Section */}
						<div className="bg-gray-50 rounded-lg p-4">
							<h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
								<User className="w-5 h-5 mr-2" />
								Thông tin bệnh nhân
							</h3>

							<div className="space-y-4">
								{/* Toggle between existing and new patient */}
								<div className="flex space-x-4">
									<button
										type="button"
										onClick={() =>
											setIsCreatingNewPatient(false)
										}
										className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
											!isCreatingNewPatient
												? "bg-blue-600 text-white"
												: "bg-white text-gray-700 border border-gray-300"
										}`}>
										Chọn bệnh nhân có sẵn
									</button>
									<button
										type="button"
										onClick={() =>
											setIsCreatingNewPatient(true)
										}
										className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center ${
											isCreatingNewPatient
												? "bg-blue-600 text-white"
												: "bg-white text-gray-700 border border-gray-300"
										}`}>
										<Plus className="w-4 h-4 mr-1" />
										Tạo bệnh nhân mới
									</button>
								</div>

								{/* Existing Patient Selection */}
								{!isCreatingNewPatient && (
									<div className="space-y-3">
										<div className="relative">
											<Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
											<input
												type="text"
												placeholder="Tìm kiếm bệnh nhân theo tên, số điện thoại..."
												value={searchTerm}
												onChange={(e) =>
													setSearchTerm(
														e.target.value
													)
												}
												className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											/>
										</div>

										<div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
											{filteredPatients.length > 0 ? (
												filteredPatients.map(
													(patient) => (
														<label
															key={patient._id}
															className="flex items-center p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0">
															<input
																type="radio"
																name="patientId"
																value={
																	patient._id
																}
																checked={
																	formData.patientId ===
																	patient._id
																}
																onChange={(e) =>
																	handleInputChange(
																		"patientId",
																		e.target
																			.value
																	)
																}
																className="mr-3 text-blue-600"
															/>
															<div className="flex-1">
																<p className="font-medium text-gray-900">
																	{
																		patient.name
																	}
																</p>
																<p className="text-sm text-gray-600">
																	{
																		patient.phoneNumber
																	}
																</p>
																{patient.email && (
																	<p className="text-sm text-gray-500">
																		{
																			patient.email
																		}
																	</p>
																)}
															</div>
														</label>
													)
												)
											) : (
												<p className="p-3 text-gray-500 text-center">
													{searchTerm
														? "Không tìm thấy bệnh nhân phù hợp"
														: "Chưa có bệnh nhân nào"}
												</p>
											)}
										</div>

										{errors.patientId && (
											<p className="text-sm text-red-600">
												{errors.patientId}
											</p>
										)}
									</div>
								)}

								{/* New Patient Form */}
								{isCreatingNewPatient && (
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Tên bệnh nhân *
											</label>
											<input
												type="text"
												value={newPatientData.name}
												onChange={(e) =>
													handleNewPatientChange(
														"name",
														e.target.value
													)
												}
												className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
													errors.patientName
														? "border-red-300"
														: "border-gray-300"
												}`}
												placeholder="Nhập tên bệnh nhân"
											/>
											{errors.patientName && (
												<p className="text-sm text-red-600 mt-1">
													{errors.patientName}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Số điện thoại *
											</label>
											<input
												type="tel"
												value={
													newPatientData.phoneNumber
												}
												onChange={(e) =>
													handleNewPatientChange(
														"phoneNumber",
														e.target.value
													)
												}
												className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
													errors.patientPhone
														? "border-red-300"
														: "border-gray-300"
												}`}
												placeholder="0xxxxxxxxx"
											/>
											{errors.patientPhone && (
												<p className="text-sm text-red-600 mt-1">
													{errors.patientPhone}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Email
											</label>
											<input
												type="email"
												value={newPatientData.email}
												onChange={(e) =>
													handleNewPatientChange(
														"email",
														e.target.value
													)
												}
												className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
													errors.patientEmail
														? "border-red-300"
														: "border-gray-300"
												}`}
												placeholder="email@example.com"
											/>
											{errors.patientEmail && (
												<p className="text-sm text-red-600 mt-1">
													{errors.patientEmail}
												</p>
											)}
										</div>

										<div>
											<label className="block text-sm font-medium text-gray-700 mb-1">
												Ngày sinh
											</label>
											<input
												type="date"
												value={
													newPatientData.dateOfBirth
												}
												onChange={(e) =>
													handleNewPatientChange(
														"dateOfBirth",
														e.target.value
													)
												}
												className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
											/>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Medical Record Information */}
						<div className="space-y-4">
							<h3 className="text-lg font-medium text-gray-900 flex items-center">
								<Stethoscope className="w-5 h-5 mr-2" />
								Thông tin y tế
							</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Chẩn đoán *
									</label>
									<input
										type="text"
										value={formData.diagnosis}
										onChange={(e) =>
											handleInputChange(
												"diagnosis",
												e.target.value
											)
										}
										className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
											errors.diagnosis
												? "border-red-300"
												: "border-gray-300"
										}`}
										placeholder="Nhập chẩn đoán"
									/>
									{errors.diagnosis && (
										<p className="text-sm text-red-600 mt-1">
											{errors.diagnosis}
										</p>
									)}
								</div>

								<div className="md:col-span-2">
									<label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
										<ClipboardList className="w-4 h-4 mr-1" />
										Điều trị
									</label>
									<textarea
										value={formData.treatment}
										onChange={(e) =>
											handleInputChange(
												"treatment",
												e.target.value
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										rows="3"
										placeholder="Mô tả phương pháp điều trị"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
										<Pill className="w-4 h-4 mr-1" />
										Thuốc
									</label>
									<input
										type="text"
										value={formData.medication}
										onChange={(e) =>
											handleInputChange(
												"medication",
												e.target.value
											)
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										placeholder="Tên thuốc"
									/>
								</div>

								<div>
									<label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
										<Calendar className="w-4 h-4 mr-1" />
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
										className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
											errors.dateBack
												? "border-red-300"
												: "border-gray-300"
										}`}
										min={
											new Date(Date.now() + 86400000)
												.toISOString()
												.split("T")[0]
										} // Tomorrow
									/>
									{errors.dateBack && (
										<p className="text-sm text-red-600 mt-1">
											{errors.dateBack}
										</p>
									)}
								</div>

								<div className="md:col-span-2">
									<label className="block text-sm font-medium text-gray-700 mb-1">
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
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
										rows="3"
										placeholder="Ghi chú thêm về tình trạng bệnh nhân"
									/>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
					<button
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
						className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
						Hủy
					</button>
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
						{isSubmitting ? (
							<>
								<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
								Đang tạo...
							</>
						) : (
							<>
								<Plus className="w-4 h-4 mr-2" />
								Tạo hồ sơ
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
};

export default memo(CreateMedicalRecordForm);
