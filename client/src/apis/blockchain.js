import axios from "../config/axios";
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

export const apiVerifyAllPatientBlocks = async (patientId) => {
   try {
      const response = await axios({
         method: "GET",
         url: `/blockchain/patient/${patientId}/verify`,
      });
      return response;
   } catch (error) {
      console.error("Error in apiVerifyAllPatientBlocks:", error);
      throw error;
   }
}

export const apiVerifyPatientBlocksTimeRange = async (patientId, startDate, endDate) => {
   try {
      const response = await axios({
         method: "GET",
         url: `/blockchain/patient/${patientId}/verify/timerange`,
         params: {
            startDate,
            endDate
         }
      });
      return response;
   } catch (error) {
      console.error("Error in apiVerifyPatientBlocksTimeRange:", error);
      throw error;
   }
};
