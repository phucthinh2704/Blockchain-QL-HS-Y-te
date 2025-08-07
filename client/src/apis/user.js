import axios from "../config/axios";

export const apiRegister = async (data) =>
	axios({
		method: "POST",
		url: `/users/register`,
		data,
		withCredentials: true,
	});

export const apiUpdateUser = async (userId, data) =>
	axios({
		method: "PUT",
		url: `/users/${userId}`,
		data,
		withCredentials: true,
	});
export const apiGetAllUsers = async () =>
	axios({
		method: "GET",
		url: `/users`,
		withCredentials: true,
	});
export const apiGetAllPatients = async () =>
	axios({
		method: "GET",
		url: `/medical/patients`,
		withCredentials: true,
	});