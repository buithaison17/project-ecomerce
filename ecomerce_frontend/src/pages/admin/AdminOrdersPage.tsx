import { ChevronLeft, ChevronRight, ClipboardList, Eye, Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import OrderDetailModal from "../../components/OrderDetailModal";
import { adminService } from "../../service/adminService";
import { normalizeOrderStatus } from "../../service/orderStatusSync";
import type { AdminOrder, PageResponse } from "../../types/admin";
import type { OrderStatus } from "../../types/order";

const statuses = ["", "PENDING", "SHIPPED", "DELIVERED", "CANCELLED"];
const labels: Record<string, string> = {
    PENDING: "Chờ xác nhận",
    SHIPPED: "Đang giao",
    DELIVERED: "Đã giao",
    CANCELLED: "Đã hủy",
};
const statusStyle: Record<string, string> = {
    PENDING: "bg-amber-400/15 text-amber-300 border border-amber-400/30",
    SHIPPED: "bg-blue-400/15 text-blue-300 border border-blue-400/30",
    DELIVERED: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/30",
    CANCELLED: "bg-rose-400/15 text-rose-300 border border-rose-400/30",
};
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function AdminOrdersPage() {
    const [page, setPage] = useState<PageResponse<AdminOrder>>({
        content: [],
        totalElements: 0,
        totalPages: 1,
        number: 1,
        size: 20,
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);
    const [viewingOrder, setViewingOrder] = useState<AdminOrder | null>(null);

    const loadOrders = useCallback(async (targetPage: number, targetFilter: string) => {
        setLoading(true);
        try {
            const data = await adminService.getOrders(targetPage, targetFilter);
            setPage(data);
        } catch {
            toast.error("Không tải được đơn hàng. Hãy kiểm tra quyền Admin.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadOrders(currentPage, filter);
    }, [currentPage, filter, loadOrders]);

    useEffect(() => {
        let timer: any;
        const handleSync = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                void loadOrders(currentPage, filter);
            }, 300);
        };

        window.addEventListener("order_status_changed", handleSync);
        window.addEventListener("storage", handleSync);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("order_status_changed", handleSync);
            window.removeEventListener("storage", handleSync);
        };
    }, [currentPage, filter, loadOrders]);

    const handleFilterChange = (newFilter: string) => {
        setFilter(newFilter);
        setCurrentPage(1);
    };

    const updateStatus = async (orderId: number, newStatus: string) => {
        const validStatus: OrderStatus = normalizeOrderStatus(newStatus);
        const currentOrder = page.content.find((o) => o.id === orderId);
        const previousStatus = currentOrder ? currentOrder.orderStatus : "PENDING";

        if (validStatus === previousStatus) return;

        // Đơn hàng đã hủy thì đã hoàn trả số lượng vào kho, không cho phép đổi trạng thái
        if (previousStatus === "CANCELLED") {
            toast.error("Đơn hàng đã hủy không thể thay đổi trạng thái!");
            return;
        }

        if (validStatus === "CANCELLED") {
            const confirmed = window.confirm(
                `Bạn có chắc chắn muốn hủy đơn hàng #${orderId}? Sau khi hủy, sản phẩm sẽ được tự động hoàn trả về kho.`
            );
            if (!confirmed) return;
        }

        setUpdatingOrderId(orderId);

        // Cập nhật lạc quan
        setPage((prev) => ({
            ...prev,
            content: prev.content.map((ord) =>
                ord.id === orderId ? { ...ord, orderStatus: validStatus } : ord
            ),
        }));

        try {
            await adminService.updateOrderStatus(orderId, validStatus);
            toast.success(`Đã cập nhật đơn #${orderId} sang "${labels[validStatus] || validStatus}"`);
            await loadOrders(currentPage, filter);
        } catch (err: any) {
            // Phục hồi lại trạng thái cũ nếu Backend báo lỗi
            setPage((prev) => ({
                ...prev,
                content: prev.content.map((ord) =>
                    ord.id === orderId ? { ...ord, orderStatus: previousStatus } : ord
                ),
            }));
            const message = err?.response?.data?.message || err?.message || "Không thể cập nhật trạng thái đơn hàng";
            toast.error(message);
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const orders = (page.content || []).filter((order) => {
        const query = search.trim().toLowerCase();
        if (!query) return true;
        const idMatch = String(order.id).includes(query);
        const nameMatch = (order.delivery?.fullName || "").toLowerCase().includes(query);
        const phoneMatch = (order.delivery?.phoneNumber || "").toLowerCase().includes(query);
        const addressMatch = (order.delivery?.address || "").toLowerCase().includes(query);
        const noteMatch = (order.note || "").toLowerCase().includes(query);
        return idMatch || nameMatch || phoneMatch || addressMatch || noteMatch;
    });

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-cyan-300">Bán hàng</p>
                    <h1 className="mt-1 text-3xl font-extrabold text-white">Quản lý đơn hàng</h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Theo dõi, kiểm tra chi tiết và cập nhật trạng thái xử lý đơn hàng theo Backend.
                    </p>
                </div>
                <button
                    onClick={() => loadOrders(currentPage, filter)}
                    disabled={loading}
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
                </button>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#102852] p-4 sm:p-5">
                <div className="flex flex-col gap-3 md:flex-row">
                    <label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0b2148] px-3 py-2.5">
                        <Search size={18} className="text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                            placeholder="Tìm theo mã đơn (#123), số điện thoại, địa chỉ hoặc ghi chú..."
                        />
                    </label>
                    <select
                        value={filter}
                        onChange={(event) => handleFilterChange(event.target.value)}
                        className="rounded-xl border border-white/10 bg-[#0b2148] px-3 py-2.5 text-sm font-semibold text-slate-200 outline-none"
                    >
                        <option value="">Tất cả trạng thái</option>
                        {statuses.slice(1).map((status) => (
                            <option key={status} value={status}>
                                {labels[status]}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#102852]">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left text-sm">
                        <thead className="bg-white/4 text-xs uppercase tracking-wide text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Mã đơn</th>
                                <th className="px-6 py-4">Khách hàng & Địa chỉ</th>
                                <th className="px-6 py-4">Thanh toán</th>
                                <th className="px-6 py-4">Tổng tiền</th>
                                <th className="px-6 py-4">Trạng thái hiện tại</th>
                                <th className="px-6 py-4">Cập nhật trạng thái</th>
                                <th className="px-6 py-4 text-center">Xem chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/8">
                            {loading && !orders.length ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 size={24} className="animate-spin text-cyan-400" />
                                            <span>Đang tải danh sách đơn hàng...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length ? (
                                orders.map((order) => {
                                    const isUpdating = updatingOrderId === order.id;
                                    const isCancelled = order.orderStatus === "CANCELLED";

                                    return (
                                        <tr key={order.id} className="text-slate-200 transition hover:bg-white/3">
                                            <td className="px-6 py-4 font-bold text-cyan-300">#{order.id}</td>
                                            <td className="px-6 py-4 max-w-[260px]">
                                                <p className="font-semibold text-white">
                                                    {order.delivery?.fullName || "Khách hàng"}
                                                </p>
                                                <p className="mt-0.5 text-xs text-slate-400">
                                                    SĐT: {order.delivery?.phoneNumber || "—"}
                                                </p>
                                                {order.delivery?.address && (
                                                    <p
                                                        className="mt-0.5 line-clamp-1 text-xs text-slate-400"
                                                        title={order.delivery.address}
                                                    >
                                                        Đ/C: {order.delivery.address}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium">
                                                    {order.paymentMethod === "CREDIT_CARD" ? "Thẻ tín dụng" : "Tiền mặt (COD)"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {order.paymentStatus === "COMPLETED" ? "Đã thanh toán" : "Chờ thanh toán"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                {currency.format(order.finalAmount || order.totalAmount || 0)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                                        statusStyle[order.orderStatus] || "bg-white/10 text-slate-300"
                                                    }`}
                                                >
                                                    {labels[order.orderStatus] || order.orderStatus}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        aria-label={`Trạng thái đơn ${order.id}`}
                                                        value={order.orderStatus}
                                                        disabled={isUpdating || isCancelled}
                                                        onChange={(event) =>
                                                            updateStatus(order.id, event.target.value as AdminOrder["orderStatus"])
                                                        }
                                                        title={
                                                            isCancelled
                                                                ? "Đơn hàng đã hủy, không thể cập nhật trạng thái"
                                                                : `Đang ở trạng thái: ${labels[order.orderStatus]}`
                                                        }
                                                        className="rounded-lg border border-white/15 bg-[#0b2148] px-3 py-1.5 text-xs font-bold text-slate-100 outline-none transition hover:border-cyan-400 focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <option value="PENDING">Chờ xác nhận</option>
                                                        <option value="SHIPPED">Đang giao</option>
                                                        <option value="DELIVERED">Đã giao</option>
                                                        <option value="CANCELLED">Đã hủy</option>
                                                    </select>
                                                    {isUpdating && (
                                                        <Loader2 size={15} className="animate-spin text-cyan-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => setViewingOrder(order)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-400/10 hover:text-cyan-200"
                                                    title="Xem chi tiết đơn hàng"
                                                >
                                                    <Eye size={15} /> Xem
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <ClipboardList className="mx-auto mb-3 text-slate-600" size={32} />
                                        <p className="font-semibold text-slate-300">Chưa có đơn hàng nào phù hợp</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm text-slate-400">
                    <span>
                        Hiển thị {orders.length} / tổng {page.totalElements} đơn hàng
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">
                            Trang {currentPage} / {Math.max(1, page.totalPages)}
                        </span>
                        <button
                            disabled={currentPage <= 1 || loading}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            className="rounded-lg border border-white/10 p-1.5 transition hover:bg-white/10 disabled:opacity-30"
                            title="Trang trước"
                        >
                            <ChevronLeft size={17} />
                        </button>
                        <button
                            disabled={currentPage >= page.totalPages || loading}
                            onClick={() => setCurrentPage((p) => p + 1)}
                            className="rounded-lg border border-white/10 p-1.5 transition hover:bg-white/10 disabled:opacity-30"
                            title="Trang sau"
                        >
                            <ChevronRight size={17} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Modal xem chi tiết đơn hàng */}
            <OrderDetailModal
                order={viewingOrder as any}
                open={!!viewingOrder}
                onClose={() => setViewingOrder(null)}
                onCancelOrder={(orderId) => {
                    void updateStatus(orderId, "CANCELLED");
                }}
            />
        </div>
    );
}

