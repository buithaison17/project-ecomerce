import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    CreditCard,
    MapPin,
    PackageCheck,
    Phone,
    RefreshCw,
    RotateCcw,
    Search,
    ShoppingBag,
    Truck,
    X,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
    orderService,
    type OrderItemResponse,
    type OrderResponse,
} from "../../service/orderService";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";

const statusTabs = [
    { key: "ALL", label: "Tất cả" },
    { key: "PENDING", label: "Chờ xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "DELIVERED", label: "Đã giao" },
    { key: "CANCELLED", label: "Đã hủy" },
];

const statusMeta: Record<
    string,
    { label: string; badgeClass: string; icon: typeof Clock; textClass: string; desc: string }
> = {
    PENDING: {
        label: "Chờ xác nhận",
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-100",
        icon: Clock,
        textClass: "text-amber-600",
        desc: "Đơn hàng đã ghi nhận và đang chờ shop kiểm tra & duyệt đơn.",
    },
    SHIPPING: {
        label: "Đang giao",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80 ring-blue-100",
        icon: Truck,
        textClass: "text-blue-600",
        desc: "Đơn hàng đang trên đường vận chuyển tới địa chỉ nhận của bạn.",
    },
    SHIPPED: {
        label: "Đang giao",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80 ring-blue-100",
        icon: Truck,
        textClass: "text-blue-600",
        desc: "Đơn hàng đang trên đường vận chuyển tới địa chỉ nhận của bạn.",
    },
    DELIVERED: {
        label: "Giao thành công",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-100",
        icon: CheckCircle2,
        textClass: "text-emerald-600",
        desc: "Đơn hàng đã được giao thành công đến bạn.",
    },
    CANCELLED: {
        label: "Đã hủy",
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-100",
        icon: XCircle,
        textClass: "text-rose-600",
        desc: "Đơn hàng đã bị hủy. Tồn kho đã được hoàn lại.",
    },
};

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
});

const formatDate = (dateString?: string) => {
    if (!dateString) return "Mới đây";
    try {
        const d = new Date(dateString);
        return new Intl.DateTimeFormat("vi-VN", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(d);
    } catch {
        return dateString;
    }
};

const resolveImageUrl = (url?: string | null) => {
    if (!url) return "https://placehold.co/120x120/f1f5f9/64748b?text=ShopNova";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function MyOrdersPage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const addItem = useCartStore((state) => state.addItem);

    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("ALL");
    const [keyword, setKeyword] = useState("");
    const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
    const [cancelSubmitting, setCancelSubmitting] = useState(false);
    const [expandedOrderIds, setExpandedOrderIds] = useState<Record<number, boolean>>({});
    const [loadedOrderItems, setLoadedOrderItems] = useState<Record<number, OrderItemResponse[]>>({});
    const [loadingDetails, setLoadingDetails] = useState<Record<number, boolean>>({});

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const pageData = await orderService.getMyOrders({
                currentPage: 1,
                pageSize: 50,
                orderStatus: activeTab === "ALL" ? undefined : activeTab,
            });
            setOrders(pageData?.content || []);
        } catch {
            setOrders([]);
            toast.error("Không thể tải danh sách đơn hàng");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        if (!user) {
            navigate("/login", { state: { returnTo: "/orders" } });
            return;
        }
        void fetchOrders();
    }, [user, navigate, fetchOrders]);

    const toggleExpand = async (orderId: number) => {
        const nextState = !expandedOrderIds[orderId];
        setExpandedOrderIds((prev) => ({ ...prev, [orderId]: nextState }));

        // If expanding and items not available in order.items and not loaded yet, fetch them
        const order = orders.find((o) => o.id === orderId);
        const hasItems = order?.items && order.items.length > 0;
        if (nextState && !hasItems && !loadedOrderItems[orderId]) {
            setLoadingDetails((prev) => ({ ...prev, [orderId]: true }));
            try {
                const items = await orderService.getOrderDetail(orderId);
                setLoadedOrderItems((prev) => ({ ...prev, [orderId]: items || [] }));
            } catch {
                toast.error("Không thể tải chi tiết sản phẩm đơn hàng");
            } finally {
                setLoadingDetails((prev) => ({ ...prev, [orderId]: false }));
            }
        }
    };

    const handleConfirmCancel = async () => {
        if (!cancellingOrderId) return;
        setCancelSubmitting(true);
        try {
            await orderService.cancelOrder(cancellingOrderId);
            toast.success("Đã hủy đơn hàng thành công");
            setCancellingOrderId(null);
            await fetchOrders();
        } catch (err: any) {
            const msg = err.response?.data?.message || "Không thể hủy đơn hàng này.";
            toast.error(msg);
        } finally {
            setCancelSubmitting(false);
        }
    };

    const handleReorder = (order: OrderResponse) => {
        const items = order.items?.length ? order.items : loadedOrderItems[order.id];
        if (!items || items.length === 0) {
            navigate("/products");
            return;
        }

        let addedCount = 0;
        items.forEach((item) => {
            if (item.product) {
                addItem({
                    id: item.product.id,
                    name: item.product.name,
                    price: item.unitPrice,
                    thumbnailUrl: item.product.thumbnailUrl || null,
                    stockQuantity: 99,
                    inStock: true,
                    description: item.product.description || "",
                    category: { id: 0, name: "", description: null },
                    images: [],
                    createdAt: "",
                    updatedAt: "",
                });
                addedCount++;
            }
        });

        toast.success(`Đã thêm ${addedCount} sản phẩm vào giỏ hàng`);
        navigate("/cart");
    };

    // Filter by keyword
    const filteredOrders = orders.filter((order) => {
        if (!keyword.trim()) return true;
        const q = keyword.trim().toLowerCase();
        const matchesId = String(order.id).includes(q);
        const matchesAddress = order.delivery?.address?.toLowerCase().includes(q);
        const matchesProduct = (order.items || loadedOrderItems[order.id] || []).some((item) =>
            item.product?.name?.toLowerCase().includes(q)
        );
        return matchesId || matchesAddress || matchesProduct;
    });

    const pendingCount = orders.filter((o) => o.orderStatus === "PENDING").length;
    const shippingCount = orders.filter((o) => o.orderStatus === "SHIPPING" || o.orderStatus === "SHIPPED").length;
    const deliveredCount = orders.filter((o) => o.orderStatus === "DELIVERED").length;

    return (
        <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-indigo-600">
                        <span>Tài khoản</span>
                        <span>/</span>
                        <span>Lịch sử mua sắm</span>
                    </div>
                    <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Đơn hàng của tôi</h1>
                    <p className="mt-1.5 text-sm text-slate-600">
                        Theo dõi hành trình xử lý, thời gian giao hàng và quản lý các đơn hàng bạn đã đặt.
                    </p>
                </div>
                <button
                    onClick={fetchOrders}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50"
                >
                    <RefreshCw size={16} className={loading ? "animate-spin text-indigo-600" : ""} />
                    <span>Làm mới</span>
                </button>
            </div>

            {/* Quick Status Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng số đơn</p>
                    <p className="mt-1 text-2xl font-black text-slate-900">{orders.length}</p>
                </div>
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Chờ xác nhận</p>
                    <p className="mt-1 text-2xl font-black text-amber-700">{pendingCount}</p>
                </div>
                <div className="rounded-2xl border border-blue-200/80 bg-blue-50/50 p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Đang giao</p>
                    <p className="mt-1 text-2xl font-black text-blue-700">{shippingCount}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Đã giao</p>
                    <p className="mt-1 text-2xl font-black text-emerald-700">{deliveredCount}</p>
                </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex overflow-x-auto pb-1 scrollbar-none sm:pb-0">
                    <div className="flex gap-1">
                        {statusTabs.map((tab) => {
                            const active = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold transition ${
                                        active
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm theo mã đơn hoặc sản phẩm..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                    />
                </div>
            </div>

            {/* Orders List */}
            <div className="mt-6 space-y-5">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                            >
                                <div className="flex justify-between">
                                    <div className="h-6 w-36 rounded-lg bg-slate-200" />
                                    <div className="h-6 w-28 rounded-lg bg-slate-200" />
                                </div>
                                <div className="mt-6 h-16 rounded-xl bg-slate-100" />
                                <div className="mt-6 flex justify-between border-t border-slate-100 pt-4">
                                    <div className="h-5 w-48 rounded bg-slate-200" />
                                    <div className="h-6 w-32 rounded bg-slate-200" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => {
                        const meta = statusMeta[order.orderStatus] || statusMeta.PENDING;
                        const StatusIcon = meta.icon;
                        const items = order.items?.length ? order.items : loadedOrderItems[order.id] || [];
                        const isExpanded = !!expandedOrderIds[order.id];
                        const isLoadingDetail = !!loadingDetails[order.id];

                        return (
                            <article
                                key={order.id}
                                className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
                            >
                                {/* Header */}
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="font-mono text-base font-black text-slate-900">
                                            #ORD-{order.id}
                                        </span>
                                        <span className="text-slate-300">•</span>
                                        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                            <Calendar size={14} className="text-slate-400" />
                                            {formatDate(order.createdAt)}
                                        </span>
                                    </div>
                                    <div
                                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-extrabold ring-1 ${meta.badgeClass}`}
                                    >
                                        <StatusIcon size={14} />
                                        <span>{meta.label}</span>
                                    </div>
                                </div>

                                <div className="p-5 sm:p-6">
                                    {/* Tracking Stepper */}
                                    <OrderTrackingStepper status={order.orderStatus} />

                                    {/* Products list preview */}
                                    <div className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
                                        {items.length > 0 ? (
                                            items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center justify-between gap-4 py-3.5"
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <img
                                                            src={resolveImageUrl(item.product?.thumbnailUrl)}
                                                            alt={item.product?.name || "Sản phẩm"}
                                                            className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 object-cover"
                                                        />
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/products/${item.product?.id}`}
                                                                className="truncate text-sm font-bold text-slate-800 transition hover:text-indigo-600 block"
                                                            >
                                                                {item.product?.name || "Sản phẩm"}
                                                            </Link>
                                                            <p className="mt-0.5 text-xs text-slate-500">
                                                                Số lượng:{" "}
                                                                <span className="font-bold text-slate-700">
                                                                    x{item.quantity}
                                                                </span>
                                                                <span className="mx-1.5 text-slate-300">|</span>
                                                                Đơn giá: {currencyFormatter.format(item.unitPrice)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="shrink-0 text-sm font-extrabold text-slate-900">
                                                        {currencyFormatter.format(item.totalAmount)}
                                                    </span>
                                                </div>
                                            ))
                                        ) : isLoadingDetail ? (
                                            <div className="py-4 text-center text-sm text-slate-400">
                                                Đang tải chi tiết sản phẩm...
                                            </div>
                                        ) : (
                                            <div className="py-3 flex items-center justify-between text-sm text-slate-500">
                                                <span>Chi tiết sản phẩm đã được đóng gói theo đơn</span>
                                                <button
                                                    onClick={() => toggleExpand(order.id)}
                                                    className="font-bold text-indigo-600 hover:underline text-xs"
                                                >
                                                    Xem sản phẩm
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Collapsible Details: Delivery, Payment, Notes */}
                                    {isExpanded && (
                                        <div className="mt-4 rounded-2xl bg-slate-50 p-4 sm:p-5 text-sm text-slate-700 space-y-3 border border-slate-100">
                                            <div className="grid gap-3 sm:grid-cols-2">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                                                        <MapPin size={14} className="text-indigo-600" />
                                                        Địa chỉ nhận hàng
                                                    </p>
                                                    <p className="mt-1 font-semibold text-slate-800">
                                                        {order.delivery?.address || "Chưa cập nhật địa chỉ"}
                                                    </p>
                                                    {order.delivery?.phoneNumber && (
                                                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                                            <Phone size={12} />
                                                            {order.delivery.phoneNumber}
                                                        </p>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1.5">
                                                        <CreditCard size={14} className="text-indigo-600" />
                                                        Hình thức thanh toán
                                                    </p>
                                                    <p className="mt-1 font-semibold text-slate-800">
                                                        {order.paymentMethod === "CASH"
                                                            ? "Thanh toán khi nhận hàng (COD)"
                                                            : "Thẻ ngân hàng / Trực tuyến"}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-slate-500">
                                                        Trạng thái:{" "}
                                                        <span
                                                            className={
                                                                order.paymentStatus === "COMPLETED"
                                                                    ? "font-bold text-emerald-600"
                                                                    : "font-bold text-amber-600"
                                                            }
                                                        >
                                                            {order.paymentStatus === "COMPLETED"
                                                                ? "Đã thanh toán"
                                                                : "Chờ thanh toán"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                            {order.note && (
                                                <div className="border-t border-slate-200/60 pt-2 text-xs">
                                                    <span className="font-bold text-slate-600">Ghi chú:</span>{" "}
                                                    <span className="text-slate-500">{order.note}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer: Amount & Actions */}
                                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleExpand(order.id)}
                                                className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
                                            >
                                                <span>{isExpanded ? "Thu gọn thông tin" : "Xem chi tiết giao nhận"}</span>
                                                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="text-right">
                                                <span className="text-xs text-slate-400 block">Tổng thanh toán:</span>
                                                <strong className="text-lg font-black text-indigo-700 sm:text-xl">
                                                    {currencyFormatter.format(order.finalAmount || order.totalAmount)}
                                                </strong>
                                            </div>

                                            {/* Action Buttons */}
                                            {order.orderStatus === "PENDING" && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCancellingOrderId(order.id)}
                                                    className="rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                                                >
                                                    Hủy đơn hàng
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => handleReorder(order)}
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-600 shadow-sm"
                                            >
                                                <RotateCcw size={14} />
                                                <span>Mua lại</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                            <ShoppingBag size={32} />
                        </div>
                        <h3 className="mt-4 text-lg font-black text-slate-900">Chưa tìm thấy đơn hàng nào</h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                            {keyword
                                ? "Không có đơn hàng nào khớp với tìm kiếm của bạn. Hãy thử từ khóa khác."
                                : "Bạn chưa có đơn hàng nào ở trạng thái này. Khám phá các sản phẩm ưu đãi ngay!"}
                        </p>
                        <Link
                            to="/products"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                        >
                            <ShoppingBag size={17} />
                            <span>Mua sắm ngay</span>
                        </Link>
                    </div>
                )}
            </div>

            {/* Cancel Order Confirmation Modal */}
            {cancellingOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
                        onClick={() => !cancelSubmitting && setCancellingOrderId(null)}
                    />
                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5 text-rose-600">
                                <AlertCircle size={22} />
                                <h3 className="text-lg font-black text-slate-900">Xác nhận hủy đơn hàng</h3>
                            </div>
                            <button
                                disabled={cancelSubmitting}
                                onClick={() => setCancellingOrderId(null)}
                                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            Bạn có chắc chắn muốn hủy đơn hàng{" "}
                            <strong className="text-slate-900">#ORD-{cancellingOrderId}</strong> không? Các sản phẩm
                            trong đơn sẽ được hoàn lại vào kho.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                disabled={cancelSubmitting}
                                onClick={() => setCancellingOrderId(null)}
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                            >
                                Giữ lại đơn
                            </button>
                            <button
                                disabled={cancelSubmitting}
                                onClick={handleConfirmCancel}
                                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-rose-200 hover:bg-rose-700 disabled:opacity-50"
                            >
                                {cancelSubmitting ? "Đang hủy..." : "Xác nhận hủy"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function OrderTrackingStepper({ status }: { status: string }) {
    if (status === "CANCELLED") {
        return (
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/60 p-3.5 flex items-center gap-3 text-xs font-semibold text-rose-800">
                <XCircle size={18} className="text-rose-600 shrink-0" />
                <span>
                    Đơn hàng này đã bị hủy. Nếu bạn đã thanh toán, số tiền sẽ được hoàn trả theo chính sách.
                </span>
            </div>
        );
    }

    // Determine current active step (1: Placed, 2: Shipping, 3: Delivered)
    let currentStep = 1;
    if (status === "SHIPPING" || status === "SHIPPED") currentStep = 2;
    if (status === "DELIVERED") currentStep = 3;

    const steps = [
        { step: 1, label: "Đã đặt đơn", icon: PackageCheck },
        { step: 2, label: "Đang vận chuyển", icon: Truck },
        { step: 3, label: "Giao thành công", icon: CheckCircle2 },
    ];

    return (
        <div className="py-2">
            <div className="relative flex items-center justify-between">
                {/* Connecting Bar */}
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 z-0">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-500"
                        style={{
                            width: currentStep === 1 ? "0%" : currentStep === 2 ? "50%" : "100%",
                        }}
                    />
                </div>

                {steps.map((item) => {
                    const isDone = item.step <= currentStep;
                    const isCurrent = item.step === currentStep;
                    const Icon = item.icon;

                    return (
                        <div key={item.step} className="relative z-10 flex flex-col items-center">
                            <div
                                className={`grid h-10 w-10 place-items-center rounded-2xl border-2 transition-all ${
                                    isDone
                                        ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                        : "border-slate-200 bg-white text-slate-400"
                                } ${isCurrent ? "ring-4 ring-indigo-50" : ""}`}
                            >
                                <Icon size={18} />
                            </div>
                            <span
                                className={`mt-2 text-xs font-bold ${
                                    isDone ? "text-indigo-900" : "text-slate-400"
                                }`}
                            >
                                {item.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
