import { api } from "../lib/axios";

export interface RegisterPayload {
    username: string;
    fullName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    gender: "MALE" | "FEMALE";
}

export interface ResetPasswordPayload {
    usernameOrEmail: string;
    newPassword: string;
}

export const loginService = {
    login: async (data: { username: string; password: string }) => {
        const response = await api.post("/auth/login", data);
        return response.data;
    },
    register: async (data: RegisterPayload) => {
        const response = await api.post("/auth/register", data);
        return response.data;
    },
    resetPassword: async (data: ResetPasswordPayload) => {
        const response = await api.post("/auth/reset-password", data);
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get("/users/me");
        return response.data;
    },
    logout: async () => {
        await api.post("/auth/logout");
    },
};
