import React, { createContext, useState, useEffect } from "react";
import { apiLogout } from "../apis/auth";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [accessToken, setAccessToken] = useState(null);
	const [refreshToken, setRefreshToken] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// Kiểm tra token khi app khởi động
	useEffect(() => {
		checkAuthStatus();
	}, []);

	const checkAuthStatus = () => {
		try {
			const storedUser = localStorage.getItem("user");
			const storedAccessToken = localStorage.getItem("accessToken");
			const storedRefreshToken = localStorage.getItem("refreshToken");

			if (storedUser && storedAccessToken) {
				setUser(JSON.parse(storedUser));
				setAccessToken(storedAccessToken);
				setRefreshToken(storedRefreshToken);
			}
		} catch (error) {
			console.error("Error checking auth status:", error);
			// Xóa dữ liệu lỗi
			localStorage.removeItem("user");
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
		}
		setIsLoading(false);
	};

	const login = (userData, accessTokenData, refreshTokenData) => {
		try {
			// Lưu vào localStorage
			localStorage.setItem("user", JSON.stringify(userData));
			localStorage.setItem("accessToken", accessTokenData);
			if (refreshTokenData) {
				localStorage.setItem("refreshToken", refreshTokenData);
			}

			// Cập nhật state
			setUser(userData);
			setAccessToken(accessTokenData);
			setRefreshToken(refreshTokenData);

			return true;
		} catch (error) {
			console.error("Error saving auth data:", error);
			return false;
		}
	};

	const logout = async () => {
		try {
			// Xóa khỏi localStorage
			const response = await apiLogout();
			if (response.success) {
				console.log("Logout successful");

				localStorage.removeItem("user");
				localStorage.removeItem("accessToken");
				localStorage.removeItem("refreshToken");

				// Reset state
				setUser(null);
				setAccessToken(null);
				setRefreshToken(null);

				return true;
			}

			return false;
		} catch (error) {
			console.error("Error during logout:", error);
			return false;
		}
	};

	const updateUser = (newUserData) => {
		try {
			const updatedUser = { ...user, ...newUserData };
			localStorage.setItem("user", JSON.stringify(updatedUser));
			setUser(updatedUser);
			return true;
		} catch (error) {
			console.error("Error updating user:", error);
			return false;
		}
	};

	const isAuthenticated = () => {
		return !!(user && accessToken);
	};

	const getAuthHeaders = () => {
		if (accessToken) {
			return {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			};
		}
		return {
			"Content-Type": "application/json",
		};
	};

	const value = {
		user,
		accessToken,
		refreshToken,
		isLoading,
		isAuthenticated,
		login,
		logout,
		updateUser,
		getAuthHeaders,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};

export { AuthContext };
export default AuthProvider;
