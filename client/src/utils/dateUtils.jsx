const formatDate = (dateString) => {
	if (!dateString) return "Không có";
	return new Date(dateString).toLocaleDateString("vi-VN");
};

const formatDateTime = (dateString) => {
	if (!dateString) return "Không có";
	return new Date(dateString).toLocaleString("vi-VN");
};

export { formatDate, formatDateTime };
