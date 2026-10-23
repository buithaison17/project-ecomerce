import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
    baseURL: "http://localhost:8080/api/v1",
    withCredentials: true,
});

// Thêm access token vào request
api.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().accessToken;

        const isAuthApi =
            config.url?.includes("/auth/login") ||
            config.url?.includes("/auth/register") ||
            config.url?.includes("/auth/refresh");

        if (token && !isAuthApi) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error),
);

// Xử lý response
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const url = originalRequest.url ?? "";

        const isAuthApi =
            url.includes("/auth/login") ||
            url.includes("/auth/register") ||
            url.includes("/auth/refresh");

        if (isAuthApi) {
            return Promise.reject(error);
        }

        // Không thử lại request nhiều lần
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const token = useAuthStore.getState().accessToken;

            if (!token) {
                return Promise.reject(error);
            }

            originalRequest.headers.Authorization = `Bearer ${token}`;

            return api(originalRequest);
        }

        return Promise.reject(error);
    },
);
