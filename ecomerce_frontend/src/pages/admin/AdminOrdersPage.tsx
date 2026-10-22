import { ChevronLeft, ChevronRight, ClipboardList, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminService } from "../../service/adminService";
import type { AdminOrder, PageResponse } from "../../types/admin";

const statuses = ["", "PENDING", "SHIPPING", "DELIVERED", "CANCELLED"];
const labels: Record<string, string> = { PENDING: "Chờ xác nhận", SHIPPING: "Đang giao", SHIPPED: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã hủy" };
const statusStyle: Record<string, string> = { PENDING: "bg-amber-400/15 text-amber-200", SHIPPING: "bg-blue-400/15 text-blue-200", SHIPPED: "bg-blue-400/15 text-blue-200", DELIVERED: "bg-emerald-400/15 text-emerald-200", CANCELLED: "bg-rose-400/15 text-rose-200" };
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function AdminOrdersPage() {
    const [page, setPage] = useState<PageResponse<AdminOrder> | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [search, setSearch] = useState("");

    const loadOrders = useCallback(() => {
        setLoading(true);
        adminService.getOrders(1, filter).then(setPage).catch(() => toast.error("Không tải được đơn hàng. Hãy kiểm tra quyền Admin.")).finally(() => setLoading(false));
    }, [filter]);
    useEffect(() => {
        void Promise.resolve().then(loadOrders);
    }, [loadOrders]);

    const updateStatus = async (orderId: number, status: string) => {
        try { await adminService.updateOrderStatus(orderId, status); toast.success("Đã cập nhật trạng thái đơn hàng"); loadOrders(); }
        catch { toast.error("Không thể cập nhật trạng thái đơn hàng"); }
    };
    const orders = (page?.content || []).filter((order) => `${order.id} ${order.delivery?.fullName || ""}`.toLowerCase().includes(search.toLowerCase()));

    return <div className="space-y-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-cyan-300">Bán hàng</p><h1 className="mt-1 text-3xl font-extrabold text-white">Quản lý đơn hàng</h1><p className="mt-2 text-sm text-slate-400">Theo dõi và cập nhật trạng thái xử lý đơn hàng.</p></div><button onClick={loadOrders} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10"><RefreshCw size={16} /> Làm mới</button></section>
        <section className="rounded-2xl border border-white/10 bg-[#102852] p-4 sm:p-5"><div className="flex flex-col gap-3 md:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0b2148] px-3 py-2.5"><Search size={18} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" placeholder="Tìm theo mã đơn hoặc khách hàng" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-white/10 bg-[#0b2148] px-3 py-2.5 text-sm font-semibold text-slate-200 outline-none"><option value="">Tất cả trạng thái</option>{statuses.slice(1).map((status) => <option key={status} value={status}>{labels[status]}</option>)}</select></div></section>
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#102852]"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-white/4 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-6 py-4">Mã đơn</th><th className="px-6 py-4">Khách hàng</th><th className="px-6 py-4">Thanh toán</th><th className="px-6 py-4">Tổng tiền</th><th className="px-6 py-4">Trạng thái</th><th className="px-6 py-4">Cập nhật</th></tr></thead><tbody className="divide-y divide-white/8">{loading ? <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400">Đang tải đơn hàng...</td></tr> : orders.length ? orders.map((order) => <tr key={order.id} className="text-slate-200 hover:bg-white/3"><td className="px-6 py-4 font-bold text-cyan-300">#{order.id}</td><td className="px-6 py-4"><p className="font-semibold">{order.delivery?.fullName || "Khách hàng"}</p><p className="mt-1 text-xs text-slate-500">{order.delivery?.phoneNumber || "—"}</p></td><td className="px-6 py-4"><p>{order.paymentMethod || "—"}</p><p className="mt-1 text-xs text-slate-500">{order.paymentStatus || "Chưa thanh toán"}</p></td><td className="px-6 py-4 font-bold">{currency.format(order.finalAmount || order.totalAmount)}</td><td className="px-6 py-4"><span className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${statusStyle[order.orderStatus] || "bg-white/10"}`}>{labels[order.orderStatus] || order.orderStatus}</span></td><td className="px-6 py-4"><select aria-label={`Trạng thái đơn ${order.id}`} value={order.orderStatus === "SHIPPED" ? "SHIPPING" : order.orderStatus} onChange={(event) => updateStatus(order.id, event.target.value)} className="rounded-lg border border-white/10 bg-[#0b2148] px-2 py-2 text-xs font-semibold outline-none"><option value="PENDING">Chờ xác nhận</option><option value="SHIPPING">Đang giao</option><option value="DELIVERED">Đã giao</option><option value="CANCELLED">Đã hủy</option></select></td></tr>) : <tr><td colSpan={6} className="px-6 py-16 text-center"><ClipboardList className="mx-auto mb-3 text-slate-600" size={30} /><p className="font-semibold text-slate-300">Chưa có đơn hàng phù hợp</p></td></tr>}</tbody></table></div>{page && <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm text-slate-400"><span>Tổng {page.totalElements} đơn hàng</span><div className="flex gap-2"><button disabled className="rounded-lg border border-white/10 p-1.5 disabled:opacity-40"><ChevronLeft size={17} /></button><button disabled={page.totalPages <= 1} className="rounded-lg border border-white/10 p-1.5 disabled:opacity-40"><ChevronRight size={17} /></button></div></div>}</section>
    </div>;
}
