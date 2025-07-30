import { useEffect } from "react";
import Header from "../components/common/Header";
import DoctorDashboard from "../components/doctor/DoctorDashboard";

const Doctor = () => {
	useEffect(() => {
		document.title = "Doctor Dashboard - MedChain";
	}, []);
	return (
		<div>
			<Header></Header>
			<DoctorDashboard></DoctorDashboard>
		</div>
	);
};

export default Doctor;
