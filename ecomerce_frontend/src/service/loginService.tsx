    import { api } from "../lib/axios";

export const loginService = {
    login: async (data: { username: string; password: string }) => {
        const response = await api.post("/auth/login", data);
        return response.data;
    },
    getCurrentUser: async () => {
        const response = await api.get("/users/me");
        return response.data;
    },
};
