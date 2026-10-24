import { api } from "../lib/axios";
import type { ApiDataResponse } from "../types/catalog";

export interface UserProfile {
    id: number;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    role: string;
    email: string;
    dateOfBirth: string | null;
    gender: "MALE" | "FEMALE" | string | null;
}

export interface UserDeliveryItem {
    id: number;
    address: string;
    phoneNumber: string;
}

export const userService = {
    async getCurrentUser(): Promise<UserProfile> {
        const response = await api.get<UserProfile>("/users/me");
        return response.data;
    },

    async updateProfile(formData: FormData) {
        const response = await api.patch<ApiDataResponse<any>>("/users", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    async changePassword(data: { oldPassword: string; newPassword: string }) {
        const response = await api.patch<ApiDataResponse<void>>("/users/change-password", data);
        return response.data;
    },

    async getDeliveries(): Promise<UserDeliveryItem[]> {
        const response = await api.get<ApiDataResponse<UserDeliveryItem[]>>("/users/deliveries");
        return response.data.data;
    },

    async createDelivery(data: { address: string; phoneNumber: string }): Promise<UserDeliveryItem> {
        const response = await api.post<ApiDataResponse<UserDeliveryItem>>("/users/deliveries", data);
        return response.data.data;
    },

    async deleteDelivery(id: number) {
        const response = await api.patch<ApiDataResponse<void>>(`/users/deliveries/${id}/delete`);
        return response.data;
    },
};
