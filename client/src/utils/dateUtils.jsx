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

const getTimeFromNow = (date) => {
	if (!date) return "";
	const now = new Date();
	const target = new Date(date);
	const diffMs = target.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays === 0) return "Hôm nay";
	if (diffDays === 1) return "Ngày mai";
	if (diffDays > 1) return `${diffDays} ngày nữa`;
	if (diffDays === -1) return "Hôm qua";
	return `${Math.abs(diffDays)} ngày trước`;
};

export { formatDate, formatDateTime, getTimeFromNow };
