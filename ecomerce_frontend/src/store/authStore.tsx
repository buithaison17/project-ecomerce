import { create } from "zustand";
import { loginService } from "../service/loginService";

interface AuthUser {
    username: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
}

const getStoredUser = (): AuthUser | null => {
    const storedUser = localStorage.getItem("currentUser");
    if (!storedUser || storedUser === "undefined") return null;

    try {
        return JSON.parse(storedUser) as AuthUser;
    } catch {
        localStorage.removeItem("currentUser");
        return null;
    }
};

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
    user: getStoredUser(),

    login: async (data) => {
        try {
            set({ loading: true });
            const response = await loginService.login(data);
            set({ accessToken: response.accessToken, user: response.user });
            localStorage.setItem("accessToken", response.accessToken);
            localStorage.setItem("currentUser", JSON.stringify(response.user));
        } finally {
            set({ loading: false });
        }
    },
    loadCurrentUser: async () => {
        if (!localStorage.getItem("accessToken")) return;
        const user = await loginService.getCurrentUser();
        set({ user });
        localStorage.setItem("currentUser", JSON.stringify(user));
    },
    logout: async () => {
        try {
            await loginService.logout();
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("currentUser");
            set({ accessToken: "", user: null });
        }
    },
}));
