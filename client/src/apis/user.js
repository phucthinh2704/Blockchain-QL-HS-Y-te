import axios from "../config/axios";

export const apiRegister = async (data) =>
	axios({
		method: "POST",
		url: `/users/register`,
		data,
		withCredentials: true,
	});