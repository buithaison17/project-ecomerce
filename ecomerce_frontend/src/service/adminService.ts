import { api } from "../lib/axios";
import type { AdminOrder, ApiDataResponse, InventoryItem, PageResponse } from "../types/admin";
import type { Category, ProductSummary } from "../types/catalog";

export const adminService = {
    async getOrders(page = 1, status?: string) {
        const response = await api.get<ApiDataResponse<PageResponse<AdminOrder>>>("/orders", {
            params: { currentPage: page, pageSize: 10, orderStatus: status || undefined },
        });
        return response.data.data;
    },

    async updateOrderStatus(orderId: number, status: string) {
        const response = await api.patch<ApiDataResponse<AdminOrder>>(`/orders/${orderId}`, { status });
        return response.data.data;
    },

    async getInventories(lowStockOnly = false) {
        const response = await api.get<ApiDataResponse<PageResponse<InventoryItem>>>("/admin/inventories", {
            params: { lowStockOnly, page: 0, size: 100 },
        });
        return response.data.data;
    },

    async restock(productId: number, quantity: number) {
        const response = await api.patch<ApiDataResponse<InventoryItem>>(
            `/admin/inventories/products/${productId}/restock`,
            { quantity },
        );
        return response.data.data;
    },

    async updateStock(productId: number, quantity: number) {
        const response = await api.put<ApiDataResponse<InventoryItem>>(
            `/admin/inventories/products/${productId}`,
            { quantity },
        );
        return response.data.data;
    },

    async createCategory(data: { name: string; description: string }) {
        return (await api.post<ApiDataResponse<Category>>("/admin/categories", data)).data.data;
    },

    async updateCategory(id: number, data: { name: string; description: string }) {
        return (await api.put<ApiDataResponse<Category>>(`/admin/categories/${id}`, data)).data.data;
    },

    async deleteCategory(id: number) {
        await api.delete(`/admin/categories/${id}`);
    },

    async createProduct(data: {
        name: string;
        description: string;
        price: number;
        categoryId: number;
        initialQuantity: number;
        imageUrls: string[];
    }) {
        return (await api.post<ApiDataResponse<ProductSummary>>("/admin/products", data)).data.data;
    },

    async updateProduct(productId: number, data: { name: string; description: string; price: number; categoryId: number; imageUrls: string[] }) {
        return (await api.put<ApiDataResponse<ProductSummary>>(`/admin/products/${productId}`, data)).data.data;
    },

    async uploadProductImage(file: File): Promise<string> {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post<ApiDataResponse<string>>("/admin/products/upload-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data.data;
    },

    async uploadProductImages(files: File[]): Promise<string[]> {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const response = await api.post<ApiDataResponse<string[]>>("/admin/products/upload-images", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data.data;
    },
};
