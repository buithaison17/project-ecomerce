import {
    AlertTriangle,
    ArrowRight,
    Boxes,
    CheckCircle2,
    CircleDollarSign,
    Clock,
    PackageCheck,
    ReceiptText,
    RefreshCw,
    TrendingUp,
    Truck,
    XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../service/adminService";
import type { DashboardSummaryResponse, InventoryItem } from "../../types/admin";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
const numberFormatter = new Intl.NumberFormat("vi-VN");

export default function AdminDashboardPage() {
    const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const loadData = () => {
        setLoading(true);
        setHasError(false);

        Promise.allSettled([
            adminService.getDashboardSummary(),
            adminService.getInventories(),
        ])
            .then(([summaryRes, inventoriesRes]) => {
                if (summaryRes.status === "fulfilled") {
                    setSummary(summaryRes.value);
                } else {
                    console.warn("Không tải được dashboard summary:", summaryRes.reason);
                }

                if (inventoriesRes.status === "fulfilled") {
                    setItems(inventoriesRes.value.content || []);
                } else {
                    console.warn("Không tải được inventories:", inventoriesRes.reason);
                    if (summaryRes.status === "rejected") {
                        setHasError(true);
                    }
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        loadData();

        let timer: any;
        const handleSync = () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                loadData();
            }, 500);
        };

        window.addEventListener("order_status_changed", handleSync);
        window.addEventListener("storage", handleSync);
        return () => {
            clearTimeout(timer);
            window.removeEventListener("order_status_changed", handleSync);
            window.removeEventListener("storage", handleSync);
        };
    }, []);

    const overview = useMemo(() => {
        const totalStock = items.reduce((total, item) => total + item.availableQuantity, 0);
        const lowStockCount = items.filter((item) => item.lowStock).length;
        const outOfStockCount = items.filter((item) => item.availableQuantity <= 0).length;

        return {
            totalRevenue: summary?.totalRevenue ?? 0,
            totalOrders: summary?.totalOrders ?? 0,
            ordersToday: summary?.ordersToday ?? 0,
            totalProducts: summary?.totalProducts ?? items.length,
            lowStockProducts: summary?.lowStockProducts ?? lowStockCount,
            outOfStockProducts: summary?.outOfStockProducts ?? outOfStockCount,
            lowStockThreshold: summary?.lowStockThreshold ?? 5,
            totalStock,
        };
    }, [summary, items]);

    // Thống kê đơn hàng theo trạng thái trả về trực tiếp từ Backend Summary
    const ordersByStatus = useMemo(() => {
        const raw = summary?.ordersByStatus || {};
        const pending = Number(raw.PENDING || 0);
        const shipped = Number(raw.SHIPPED || 0);
        const delivered = Number(raw.DELIVERED || 0);
        const cancelled = Number(raw.CANCELLED || 0);
        const total = overview.totalOrders || (pending + shipped + delivered + cancelled) || 1;

        return [
            {
                status: "PENDING",
                label: "Chờ xác nhận",
                count: pending,
                percent: Math.round((pending / total) * 100),
                icon: Clock,
                color: "text-amber-300",
                bgColor: "bg-amber-400/10",
                borderColor: "border-amber-400/20",
                barColor: "bg-amber-400",
            },
            {
                status: "SHIPPED",
                label: "Đang giao hàng",
                count: shipped,
                percent: Math.round((shipped / total) * 100),
                icon: Truck,
                color: "text-blue-300",
                bgColor: "bg-blue-400/10",
                borderColor: "border-blue-400/20",
                barColor: "bg-blue-400",
            },
            {
                status: "DELIVERED",
                label: "Đã giao thành công",
                count: delivered,
                percent: Math.round((delivered / total) * 100),
                icon: CheckCircle2,
                color: "text-emerald-300",
                bgColor: "bg-emerald-400/10",
                borderColor: "border-emerald-400/20",
                barColor: "bg-emerald-400",
            },
            {
                status: "CANCELLED",
                label: "Đã hủy",
                count: cancelled,
                percent: Math.round((cancelled / total) * 100),
                icon: XCircle,
                color: "text-rose-300",
                bgColor: "bg-rose-400/10",
                borderColor: "border-rose-400/20",
                barColor: "bg-rose-400",
            },
        ];
    }, [summary, overview.totalOrders]);

    const cards = [
        {
            label: "Doanh thu thành công",
            value: currency.format(overview.totalRevenue),
            icon: CircleDollarSign,
            color: "bg-emerald-500",
            detail: "Đơn giao thành công (DELIVERED)",
        },
        {
            label: "Tổng đơn hàng",
            value: numberFormatter.format(overview.totalOrders),
            icon: ReceiptText,
            color: "bg-blue-500",
            detail: `Hôm nay: ${overview.ordersToday} đơn mới`,
        },
        {
            label: "Sản phẩm đang bán",
            value: numberFormatter.format(overview.totalProducts),
            icon: PackageCheck,
            color: "bg-violet-500",
            detail: `Kho có: ${numberFormatter.format(overview.totalStock)} đơn vị`,
        },
        {
            label: "Cảnh báo tồn kho",
            value: `${overview.lowStockProducts} mặt hàng`,
            icon: AlertTriangle,
            color: "bg-rose-500",
            detail: `Hết hàng: ${overview.outOfStockProducts} (Ngưỡng tồn ≤ ${overview.lowStockThreshold})`,
        },
    ];

    return (
        <div className="space-y-7">
            {/* Header */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-cyan-300">Bảng điều khiển quản trị</p>
                    <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Tổng quan cửa hàng</h1>
                    <p className="mt-2 text-sm text-slate-400">Số liệu kinh doanh, đơn hàng và kho hàng theo thời gian thực.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Làm mới
                    </button>
                    <Link
                        to="/admin/orders"
                        className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#071a3a] transition hover:bg-cyan-300"
                    >
                        <ReceiptText size={17} /> Quản lý đơn hàng
                    </Link>
                </div>
            </section>

            {hasError && (
                <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                    Không tải được một số số liệu từ máy chủ. Hãy kiểm tra backend và quyền tài khoản Quản trị viên.
                </div>
            )}

            {/* 4 Chỉ số KPI chính */}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, icon: Icon, color, detail }) => (
                    <article key={label} className="rounded-2xl border border-white/10 bg-[#102852] p-5 shadow-xl shadow-slate-950/10 transition hover:border-white/20">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-400">{label}</p>
                                <p className="mt-3 text-2xl font-extrabold text-white xl:text-3xl">{loading ? "—" : value}</p>
                            </div>
                            <span className={`grid size-11 place-items-center rounded-xl ${color} text-white shadow-md`}>
                                <Icon size={21} />
                            </span>
                        </div>
                        <p className="mt-4 text-xs font-medium text-slate-400">{detail}</p>
                    </article>
                ))}
            </section>

            {/* Phân bổ trạng thái đơn hàng (Backend Summary) */}
            <section className="rounded-2xl border border-white/10 bg-[#102852] p-5 sm:p-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Phân bổ trạng thái đơn hàng</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Tổng {numberFormatter.format(overview.totalOrders)} đơn hàng trong toàn bộ hệ thống
                        </p>
                    </div>
                    <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-bold text-cyan-300 hover:text-cyan-200">
                        Xem danh sách đơn <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {ordersByStatus.map(({ status, label, count, percent, icon: Icon, color, bgColor, borderColor, barColor }) => (
                        <Link
                            key={status}
                            to={`/admin/orders`}
                            className={`block rounded-xl border ${borderColor} ${bgColor} p-4 transition hover:scale-[1.02]`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-200">
                                    <Icon size={18} className={color} /> {label}
                                </span>
                                <span className={`text-xl font-extrabold ${color}`}>{loading ? "—" : count}</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                                <span>Tỷ trọng</span>
                                <span className="font-semibold text-slate-200">{loading ? "—" : `${percent}%`}</span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Tồn kho & Cảnh báo kho */}
            <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
                {/* Top sản phẩm có tồn kho sẵn sàng cao nhất */}
                <article className="rounded-2xl border border-white/10 bg-[#102852] p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-white">Sản phẩm sẵn sàng bán nhiều nhất</h2>
                            <p className="mt-1 text-sm text-slate-400">Số lượng hàng có sẵn trong kho</p>
                        </div>
                        <TrendingUp className="text-cyan-300" />
                    </div>

                    <div className="mt-6 space-y-5">
                        {(loading
                            ? Array.from({ length: 5 })
                            : [...items].sort((a, b) => b.availableQuantity - a.availableQuantity).slice(0, 5)
                        ).map((item, index) => {
                            const inventory = item as InventoryItem | undefined;
                            const max = Math.max(...items.map((entry) => entry.availableQuantity), 1);
                            const width = inventory ? Math.max((inventory.availableQuantity / max) * 100, 4) : 60 - index * 8;

                            return (
                                <div key={inventory?.productId ?? index} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-5 gap-y-2">
                                    <span className={`truncate text-sm font-semibold ${inventory ? "text-slate-200" : "h-4 w-40 animate-pulse rounded bg-white/10"}`}>
                                        {inventory?.productName || "Đang tải tên sản phẩm..."}
                                    </span>
                                    <span className="text-sm font-bold text-cyan-300">
                                        {inventory ? numberFormatter.format(inventory.availableQuantity) : ""}
                                    </span>
                                    <div className="col-span-2 h-2 overflow-hidden rounded-full bg-white/8">
                                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{ width: `${width}%` }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </article>

                {/* Quick actions box */}
                <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#163568] to-[#102852] p-6 flex flex-col justify-between">
                    <div>
                        <span className="grid size-11 place-items-center rounded-xl bg-cyan-400 text-[#071a3a]">
                            <Boxes size={23} />
                        </span>
                        <h2 className="mt-5 text-xl font-extrabold text-white">Quản lý kho hàng & sản phẩm</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            Cập nhật số lượng nhập hàng, quản lý danh mục và đăng bán sản phẩm mới với ảnh chụp từ thiết bị.
                        </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3">
                        <Link
                            to="/admin/products"
                            className="inline-flex items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15"
                        >
                            <span>Thêm sản phẩm mới</span>
                            <ArrowRight size={16} className="text-cyan-300" />
                        </Link>
                        <Link
                            to="/admin/inventory"
                            className="inline-flex items-center justify-between rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#071a3a] transition hover:bg-cyan-300"
                        >
                            <span>Xem bảng tồn kho</span>
                            <Boxes size={16} />
                        </Link>
                    </div>
                </article>
            </section>

            {/* Cảnh báo sản phẩm sắp hết hàng */}
            <section className="rounded-2xl border border-white/10 bg-[#102852]">
                <div className="flex items-center justify-between border-b border-white/10 p-5 sm:px-6">
                    <div>
                        <h2 className="font-bold text-white">Cảnh báo tồn kho</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Các sản phẩm có số lượng sẵn bán ≤ {overview.lowStockThreshold} đơn vị cần nhập bổ sung.
                        </p>
                    </div>
                    <Link to="/admin/inventory?filter=low" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">
                        Xem tất cả ({overview.lowStockProducts})
                    </Link>
                </div>

                <div className="divide-y divide-white/8">
                    {!loading &&
                        items
                            .filter((item) => item.lowStock || item.availableQuantity <= overview.lowStockThreshold)
                            .slice(0, 5)
                            .map((item) => (
                                <div key={item.productId} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6">
                                    <div className="min-w-0">
                                        <p className="truncate font-semibold text-slate-100">{item.productName}</p>
                                        <p className="mt-1 text-xs text-slate-400">Mã sản phẩm #{item.productId}</p>
                                    </div>
                                    <span
                                        className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                                            item.availableQuantity <= 0
                                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                                : "bg-amber-400/15 text-amber-300 border border-amber-400/30"
                                        }`}
                                    >
                                        {item.availableQuantity <= 0 ? "Hết hàng (0)" : `Còn ${item.availableQuantity}`}
                                    </span>
                                </div>
                            ))}

                    {!loading && !items.some((item) => item.lowStock || item.availableQuantity <= overview.lowStockThreshold) && (
                        <p className="px-6 py-7 text-center text-sm text-slate-400">
                            Tồn kho đang ở mức an toàn. Tất cả sản phẩm đều có số lượng dồi dào.
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
}
