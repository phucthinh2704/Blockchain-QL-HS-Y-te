import axios from "../config/axios";

export const apiGetUserMedicalRecords = async (userId) => {
	try {
		const response = await axios({
			method: "GET",
			url: `/medical/patient/${userId}`,
		});
		return response;
	} catch (error) {
		console.error("Error in apiGetUserMedicalRecords:", error);
		throw error;
	}
};

export const apiGetRecordHistory = async (recordId) => {
	try {
		const response = await axios({
			method: "GET",
			url: `/blockchain/record/${recordId}/history`,
		});
		return response;
	} catch (error) {
		console.error("Error in apiGetRecordHistory:", error);
		throw error;
	}
};

export const apiVerifyRecord = async (recordId) => {
	try {
		const response = await axios({
			method: "GET",
			url: `/blockchain/record/${recordId}/verify`,
		});
		return response;
	} catch (error) {
		console.error("Error in apiVerifyRecord:", error);
		throw error;
	}
}
