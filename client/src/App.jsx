import { Route, Routes } from "react-router-dom";
import "./App.css";
import MedicalBlockchainApp from "./components/MedicalBlockchainApp ";
import LoginRegister from "./pages/Login";
import Public from "./pages/Public";

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
		</Routes>
	);
}

export default App;
