import {
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Eye,
    Loader2,
    RefreshCw,
    Search,
} from "lucide-react";
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
    SHIPPED: "Đang giao hàng",
    DELIVERED: "Đã giao thành công",
    CANCELLED: "Đã hủy đơn",
};

const statusStyle: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
    SHIPPED: "bg-blue-50 text-blue-700 border border-blue-200",
    DELIVERED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-700 border border-rose-200",
};

const currency = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

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

    const loadOrders = useCallback(
        async (targetPage: number, targetFilter: string) => {
            setLoading(true);
            try {
                const data = await adminService.getOrders(targetPage, targetFilter);
                setPage(data);
            } catch {
                toast.error("Không tải được đơn hàng. Hãy kiểm tra quyền Admin.");
            } finally {
                setLoading(false);
            }
        },
        [],
    );

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

    const handleFilterChange = (val: string) => {
        setFilter(val);
        setCurrentPage(1);
    };

    const updateStatus = async (orderId: number, nextStatus: AdminOrder["orderStatus"]) => {
        const canonical = normalizeOrderStatus(nextStatus);
        setUpdatingOrderId(orderId);
        try {
            await adminService.updateOrderStatus(orderId, canonical as OrderStatus);
            toast.success(`Đơn #${orderId} chuyển sang: ${labels[canonical] || canonical}`);
            setPage((prev) => ({
                ...prev,
                content: prev.content.map((ord) =>
                    ord.id === orderId
                        ? {
                              ...ord,
                              orderStatus: canonical as AdminOrder["orderStatus"],
                              updatedAt: new Date().toISOString(),
                          }
                        : ord,
                ),
            }));
            window.dispatchEvent(new CustomEvent("order_status_changed", { detail: { orderId, nextStatus: canonical } }));
        } catch (err: any) {
            void loadOrders(currentPage, filter);
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
            {/* Header */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                        Quản lý bán hàng
                    </span>
                    <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                        Danh sách đơn hàng
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Theo dõi tiến độ, kiểm tra địa chỉ giao nhận và cập nhật trạng thái xử lý đơn hàng.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => loadOrders(currentPage, filter)}
                    disabled={loading}
                    className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới danh sách
                </button>
            </section>

            {/* Filter and search bar */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col gap-3 md:flex-row">
                    <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5">
                        <Search size={16} className="text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full bg-transparent text-xs font-medium text-slate-800 outline-none placeholder:text-slate-400"
                            placeholder="Tìm kiếm theo mã đơn (#12), tên khách hàng, số điện thoại, địa chỉ..."
                        />
                    </label>
                    <select
                        value={filter}
                        onChange={(event) => handleFilterChange(event.target.value)}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none transition focus:border-indigo-500 cursor-pointer"
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

            {/* Orders Table */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[920px] text-left text-xs">
                        <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Mã đơn</th>
                                <th className="px-6 py-4">Khách hàng & Địa chỉ</th>
                                <th className="px-6 py-4">Thanh toán</th>
                                <th className="px-6 py-4">Tổng tiền</th>
                                <th className="px-6 py-4">Trạng thái hiện tại</th>
                                <th className="px-6 py-4">Cập nhật trạng thái</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && !orders.length ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Loader2 size={24} className="animate-spin text-indigo-600" />
                                            <span className="text-xs font-semibold">Đang tải danh sách đơn hàng...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : orders.length ? (
                                orders.map((order) => {
                                    const isUpdating = updatingOrderId === order.id;
                                    const isCancelled = order.orderStatus === "CANCELLED";

                                    return (
                                        <tr
                                            key={order.id}
                                            className="text-slate-700 transition hover:bg-slate-50/60"
                                        >
                                            <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                                                #{order.id}
                                            </td>
                                            <td className="px-6 py-4 max-w-[260px]">
                                                <p className="font-bold text-slate-900">
                                                    {order.delivery?.fullName || "Khách hàng"}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-500">
                                                    SĐT: {order.delivery?.phoneNumber || "—"}
                                                </p>
                                                {order.delivery?.address && (
                                                    <p
                                                        className="mt-0.5 line-clamp-1 text-[11px] text-slate-400"
                                                        title={order.delivery.address}
                                                    >
                                                        Đ/C: {order.delivery.address}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {order.paymentMethod === "CREDIT_CARD"
                                                        ? "Thẻ tín dụng"
                                                        : "Tiền mặt (COD)"}
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-slate-400">
                                                    {order.paymentStatus === "COMPLETED"
                                                        ? "Đã thanh toán"
                                                        : "Chờ thanh toán"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">
                                                {currency.format(
                                                    order.finalAmount || order.totalAmount || 0,
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                        statusStyle[order.orderStatus] ||
                                                        "bg-slate-100 text-slate-700"
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
                                                            updateStatus(
                                                                order.id,
                                                                event.target.value as AdminOrder["orderStatus"],
                                                            )
                                                        }
                                                        title={
                                                            isCancelled
                                                                ? "Đơn hàng đã hủy, không thể cập nhật trạng thái"
                                                                : `Đang ở trạng thái: ${labels[order.orderStatus]}`
                                                        }
                                                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none transition focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                                                    >
                                                        <option value="PENDING">Chờ xác nhận</option>
                                                        <option value="SHIPPED">Đang giao</option>
                                                        <option value="DELIVERED">Đã giao</option>
                                                        <option value="CANCELLED">Đã hủy</option>
                                                    </select>
                                                    {isUpdating && (
                                                        <Loader2
                                                            size={15}
                                                            className="animate-spin text-indigo-600"
                                                        />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingOrder(order)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-600 shadow-xs transition hover:bg-indigo-50 hover:border-indigo-200"
                                                    title="Xem chi tiết đơn hàng"
                                                >
                                                    <Eye size={14} /> Chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <ClipboardList className="mx-auto mb-2 text-slate-300" size={36} />
                                        <p className="font-bold text-slate-800 text-sm">
                                            Không có đơn hàng nào phù hợp
                                        </p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            Hãy thử thay đổi điều kiện lọc trạng thái hoặc từ khóa tìm kiếm.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-xs text-slate-500 sm:flex-row">
                    <span>
                        Hiển thị <strong>{orders.length}</strong> / tổng số <strong>{page.totalElements}</strong> đơn hàng
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">
                            Trang {currentPage} / {Math.max(1, page.totalPages)}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                                title="Trang trước"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                disabled={currentPage >= page.totalPages || loading}
                                onClick={() => setCurrentPage((p) => p + 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                                title="Trang sau"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modal Detail */}
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
