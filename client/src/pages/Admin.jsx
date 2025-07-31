import { useEffect } from "react";
import Header from "../components/common/Header";
import AdminDashboard from "../components/admin/AdminDashboard";

const Admin = () => {
	useEffect(() => {
		document.title = "Admin Dashboard - MedChain";
	}, []);
	return (
		<div>
			<div className="pl-30">
				<Header></Header>
			</div>
			<AdminDashboard></AdminDashboard>
		</div>
	);
};

export default Admin;
