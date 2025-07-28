import axios from "axios";

const instance = axios.create({
   baseURL: import.meta.env.VITE_API_URI,
});

// Add a request interceptor
instance.interceptors.request.use(
   function (config) {
      const accessToken = window.localStorage.getItem("accessToken");
      if (accessToken) {
         config.headers['authorization'] = `Bearer ${accessToken}`;
      }
      return config;
   },
   function (error) {
      return Promise.reject(error);
   }
);


// Add a response interceptor
// interceptor response — sửa đoạn này:
instance.interceptors.response.use(
   function (response) {
      return response.data; // OK
   },
   function (error) {
      return error.response.data;
   }
);


export default instance;
