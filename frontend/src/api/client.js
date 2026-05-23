import axios from "axios";
import { getToken } from "../utils/auth";

const configuredBaseUrl = import.meta.env.VITE_API_URL;
const isProd = import.meta.env.PROD;

if (isProd && (!configuredBaseUrl || configuredBaseUrl.includes("localhost"))) {
  console.error(
    "VITE_API_URL is missing or points to localhost in production. Set it to your public backend API URL."
  );
}

const api = axios.create({
  baseURL: configuredBaseUrl || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || error.message;
    const url = error?.config?.url || "unknown-url";
    console.error(`[API ERROR] ${status || "NO_STATUS"} ${url} - ${message}`);
    return Promise.reject(error);
  }
);

export default api;
