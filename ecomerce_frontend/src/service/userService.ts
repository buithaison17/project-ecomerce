import { api } from "../lib/axios";

export interface UserProfile {
    id: number;
    username: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
    dateOfBirth: string;
    gender: string;
    role: string;
}

export interface ChangePasswordRequest {
    oldPassword: string;
    newPassword: string;
}

export const userService = {
    async getCurrentUser() {
        return (await api.get<{ data: UserProfile }>("/api/v1/users/me")).data.data;
    },

    async updateProfile(data: FormData) {
        return (await api.patch<{ data: UserProfile }>("/api/v1/users", data)).data.data;
    },

    async changePassword(data: ChangePasswordRequest) {
        return (await api.patch("/api/v1/users/change-password", data)).data;
    },
};
