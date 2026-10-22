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
    user: AuthUser | null;
    login: (data: { username: string; password: string }) => Promise<void>;
    loadCurrentUser: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuthStore = create<State>((set) => ({
    loading: false,
    user: null,
    login: async (data) => {
        try {
            set({ loading: true });
            const response = await loginService.login(data);
            set({ user: response.user });
        } finally {
            set({ loading: false });
        }
    },
    loadCurrentUser: async () => {
        try {
            const user = await loginService.getCurrentUser();
            set({ user });
        } catch {
            set({ user: null });
        }
    },
    logout: async () => {
        try {
            await loginService.logout();
        } finally {
            set({ user: null });
        }
    },
}));
