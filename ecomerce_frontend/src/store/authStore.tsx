import { create } from "zustand";
import { loginService } from "../service/loginService";

interface AuthUser {
    username: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
}

interface State {
    loading: boolean;
    accessToken: string;
    user: AuthUser | null;
    login: (data: { username: string; password: string }) => Promise<void>;
    loadCurrentUser: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<State>((set) => ({
    loading: false,
    accessToken: localStorage.getItem("accessToken") || "",
    user: null,

    login: async (data) => {
        try {
            set({ loading: true });

            const response = await loginService.login(data);

            // Giả sử loginService trả về dữ liệu có dạng:
            // { user: AuthUser, accessToken: string }
            const { user, accessToken } = response;

            if (accessToken) {
                localStorage.setItem("accessToken", accessToken);
            }

            set({
                user,
                accessToken: accessToken || "",
            });
        } finally {
            set({ loading: false });
        }
    },

    loadCurrentUser: async () => {
        const token = useAuthStore.getState().accessToken;

        if (!token) {
            set({ user: null });
            return;
        }

        try {
            const response = await loginService.getCurrentUser();

            // Nếu service trả về AxiosResponse, sử dụng response.data.
            // Nếu service đã trả về user trực tiếp, sử dụng response.
            const user = response.data ?? response;

            set({ user });
        } catch {
            set({ user: null });
        }
    },

    logout: async () => {
        try {
            await loginService.logout();
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");

            set({
                user: null,
                accessToken: "",
            });
        }
    },
}));
