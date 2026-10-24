import { create } from "zustand";
import { loginService } from "../service/loginService";

export interface AuthUser {
    id?: number;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
    email?: string;
    dateOfBirth?: string | null;
    gender?: "MALE" | "FEMALE" | string | null;
}

interface State {
    loading: boolean;
    user: AuthUser | null;
    login: (data: { username: string; password: string }) => Promise<void>;
    loadCurrentUser: () => Promise<void>;
    updateUser: (partial: Partial<AuthUser>) => void;
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
    updateUser: (partial) => {
        set((state) => ({
            user: state.user ? { ...state.user, ...partial } : null,
        }));
    },
    logout: async () => {
        try {
            await loginService.logout();
        } finally {
            set({ user: null });
        }
    },
}));
