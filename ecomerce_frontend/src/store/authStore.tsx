import { create } from "zustand";
import { loginService } from "../service/loginService";

interface State {
    loading: boolean;
    accessToken: string;
    login: (data: { username: string; password: string }) => Promise<void>;
}

export const useAuthStore = create<State>((set) => ({
    loading: false,
    accessToken: localStorage.getItem("accessToken") || "",

    login: async (data) => {
        try {
            set({ loading: true });
            const response = await loginService.login(data);
            set({ accessToken: response.accessToken });
            localStorage.setItem("accessToken", response.accessToken);
        } finally {
            set({ loading: false });
        }
    },
}));
