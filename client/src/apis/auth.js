import axios from "../config/axios";

// Traditional authentication
export const apiLogin = async (data) =>
	axios({
		method: "POST",
		url: `/auth/login`,
		data,
		withCredentials: true,
	});

export const apiRegister = async (data) =>
	axios({
		method: "POST",
		url: `/auth/register`,
		data,
		withCredentials: true,
	});

export const apiLogout = async () =>
	axios({
		method: "POST",
		url: `/auth/logout`,
		withCredentials: true,
	});

export const apiRefreshToken = async (refreshToken) =>
	axios({
		method: "POST",
		url: `/auth/refresh-token`,
		data: { refreshToken },
		withCredentials: true,
	});

// Wallet authentication
export const apiWalletLogin = async (data) =>
	axios({
		method: "POST",
		url: `/auth/wallet-login`,
		data,
		withCredentials: true,
	});

export const apiWalletRegister = async (data) =>
	axios({
		method: "POST",
		url: `/auth/wallet-register`,
		data,
		withCredentials: true,
	});

export const apiGetWalletLoginMessage = async (walletAddress) =>
	axios({
		method: "POST",
		url: `/auth/wallet-message`,
		data: { walletAddress },
		withCredentials: true,
	});

export const apiGetWalletRegistrationMessage = async (walletAddress) =>
	axios({
		method: "POST",
		url: `/auth/wallet-register-message`,
		data: { walletAddress },
		withCredentials: true,
	});

// Wallet signature helper
export const signMessageWithWallet = async (message) => {
	if (typeof window.ethereum === "undefined") {
		throw new Error("MetaMask is not installed");
	}

	try {
		const accounts = await window.ethereum.request({
			method: "eth_accounts",
		});
		if (accounts.length === 0) {
			throw new Error("No wallet connected");
		}

		const signature = await window.ethereum.request({
			method: "personal_sign",
			params: [message, accounts[0]],
		});

		return {
			signature,
			walletAddress: accounts[0],
		};
	} catch (error) {
		console.error("Error signing message:", error);
		throw error;
	}
};
