import { Route, Routes } from "react-router-dom";
import "./App.css";
import LoginRegister from "./pages/Login";
import Public from "./pages/Public";
import DoctorDashboard from "./pages/Doctor";
import Admin from "./pages/Admin";

function App() {
	return (
		<Routes>
			<Route
				path={`/login`}
				element={<LoginRegister />}
			/>
			<Route
				path={`/`}
				element={<Public />}
			/>
			<Route
				path={`/doctors`}
				element={<DoctorDashboard />}
			/>
			<Route
				path={`/admin`}
				element={<Admin />}
			/>
		</Routes>
	);
}

export default App;
