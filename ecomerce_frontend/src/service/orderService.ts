import { api } from "../lib/axios";
import type { ApiDataResponse, PageResponse } from "../types/catalog";

export interface OrderItemProduct {
    id: number;
    name: string;
    description?: string;
    price: number;
    thumbnailUrl?: string | null;
}

export interface OrderItemResponse {
    id: number;
    product: OrderItemProduct;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
}

export interface OrderResponse {
    id: number;
    totalAmount: number;
    shippingAmount: number;
    finalAmount: number;
    orderStatus: "PENDING" | "SHIPPING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    paymentMethod: "CASH" | "CREDIT_CARD";
    paymentStatus: "PENDING" | "COMPLETED";
    note?: string;
    delivery: { id: number; address: string; phoneNumber: string };
    items?: OrderItemResponse[];
    createdAt?: string;
}

interface DeliveryResponse {
    id: number;
    address: string;
    phoneNumber: string;
}

export const orderService = {
    async createDelivery(data: { address: string; phoneNumber: string }) {
        return (await api.post<ApiDataResponse<DeliveryResponse>>("/users/deliveries", data)).data.data;
    },
    async createOrder(data: {
        items: { productId: number; quantity: number }[];
        deliveryId: number;
        paymentMethod: "CASH" | "CREDIT_CARD";
        note?: string;
    }) {
        return (await api.post<ApiDataResponse<OrderResponse>>("/orders", data)).data.data;
    },
    async getMyOrders(params?: { currentPage?: number; pageSize?: number; orderStatus?: string }) {
        const queryParams: Record<string, string | number> = {
            currentPage: params?.currentPage ?? 1,
            pageSize: params?.pageSize ?? 10,
        };
        if (params?.orderStatus) {
            queryParams.orderStatus = params.orderStatus;
        }
        return (
            await api.get<ApiDataResponse<PageResponse<OrderResponse>>>("/orders/users", {
                params: queryParams,
            })
        ).data.data;
    },
    async getOrderDetail(orderId: number) {
        return (await api.get<ApiDataResponse<OrderItemResponse[]>>(`/orders/${orderId}`)).data.data;
    },
    async cancelOrder(orderId: number) {
        return (await api.patch<ApiDataResponse<OrderResponse>>(`/orders/${orderId}/cancel`)).data.data;
    },
};
