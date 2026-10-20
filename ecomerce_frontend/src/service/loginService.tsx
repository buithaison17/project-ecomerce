import { api } from "../lib/axios";

export const loginService = {
    login: async (data: { username: string; password: string }) => {
        const response = await api.post("/auth/login", data);
        return response.data;
    },
};
