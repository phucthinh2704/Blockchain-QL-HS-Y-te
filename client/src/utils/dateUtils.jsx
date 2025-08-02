const formatDate = (dateString) => {
	if (!dateString) return "Không có";
	return new Date(dateString).toLocaleDateString("vi-VN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
};

const formatDateTime = (dateString) => {
	if (!dateString) return "Không có";
	return new Date(dateString).toLocaleString("vi-VN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
};

export { formatDate, formatDateTime };
