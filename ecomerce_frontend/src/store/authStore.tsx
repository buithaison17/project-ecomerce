import { create } from "zustand";
import { loginService } from "../service/loginService";
import { cartService } from "../service/cartService";
import { useCartStore } from "./cartStore";

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

            // Đồng bộ giỏ hàng LocalStorage với Backend sau khi đăng nhập
            const localCartItems = useCartStore.getState().items;
            if (localCartItems.length > 0) {
                try {
                    const syncItems = localCartItems.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                    }));
                    const syncedCart = await cartService.sync(syncItems);
                    // Cập nhật giỏ hàng LocalStorage từ dữ liệu Backend
                    useCartStore.getState().clearCart();
                    syncedCart.items.forEach((item) => {
                        useCartStore.getState().addItem({
                            id: item.productId,
                            name: item.name,
                            price: item.price,
                            thumbnailUrl: item.thumbnailUrl,
                            stockQuantity: item.stockQuantity,
                        });
                        // Cập nhật số lượng chính xác
                        useCartStore.getState().updateQuantity(item.productId, item.quantity);
                    });
                } catch (error) {
                    console.error("Lỗi đồng bộ giỏ hàng:", error);
                }
            } else {
                // Nếu LocalStorage trống, lấy giỏ hàng từ Backend
                try {
                    const backendCart = await cartService.getCart();
                    useCartStore.getState().clearCart();
                    backendCart.items.forEach((item) => {
                        useCartStore.getState().addItem({
                            id: item.productId,
                            name: item.name,
                            price: item.price,
                            thumbnailUrl: item.thumbnailUrl,
                            stockQuantity: item.stockQuantity,
                        });
                        useCartStore.getState().updateQuantity(item.productId, item.quantity);
                    });
                } catch (error) {
                    console.error("Lỗi lấy giỏ hàng từ Backend:", error);
                }
            }
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
