import { AlertTriangle, ArrowRight, Boxes, CircleDollarSign, PackageCheck, ReceiptText, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../service/adminService";
import type { InventoryItem } from "../../types/admin";

const numberFormatter = new Intl.NumberFormat("vi-VN");

const topCategories = [
    { name: "Điện thoại", value: 42, color: "#22d3ee" },
    { name: "Laptop", value: 28, color: "#818cf8" },
    { name: "Phụ kiện", value: 18, color: "#fbbf24" },
    { name: "Gia dụng", value: 12, color: "#f472b6" },
];

const monthlyRevenue = [36, 52, 44, 68, 59, 85, 76, 96, 88, 112, 104, 130];
const revenuePath = monthlyRevenue.map((value, index) => {
    const x = 20 + index * (320 / (monthlyRevenue.length - 1));
    const y = 160 - ((value - 30) / 110) * 125;
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
}).join(" ");

export default function AdminDashboardPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        adminService.getInventories()
            .then((page) => setItems(page.content))
            .catch(() => setHasError(true))
            .finally(() => setLoading(false));
    }, []);

    const overview = useMemo(() => ({
        productCount: items.length,
        available: items.reduce((total, item) => total + item.availableQuantity, 0),
        reserved: items.reduce((total, item) => total + item.reservedQuantity, 0),
        lowStock: items.filter((item) => item.lowStock).length,
    }), [items]);

    const cards = [
        { label: "Sản phẩm đang quản lý", value: overview.productCount, icon: PackageCheck, color: "bg-violet-500", detail: "Danh mục sản phẩm" },
        { label: "Sẵn sàng bán", value: numberFormatter.format(overview.available), icon: Boxes, color: "bg-cyan-500", detail: "Đơn vị trong kho" },
        { label: "Đang được giữ", value: numberFormatter.format(overview.reserved), icon: ReceiptText, color: "bg-amber-500", detail: "Chờ xử lý đơn hàng" },
        { label: "Sắp hết hàng", value: overview.lowStock, icon: AlertTriangle, color: "bg-rose-500", detail: "Cần nhập thêm hàng" },
    ];

    return (
        <div className="space-y-7">
            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><p className="text-sm font-semibold text-cyan-300">Bảng điều khiển</p><h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Xin chào, Quản trị viên!</h1><p className="mt-2 text-sm text-slate-400">Theo dõi hoạt động bán hàng và tồn kho của cửa hàng.</p></div>
                <Link to="/admin/inventory" className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#071a3a] transition hover:bg-cyan-300"><Boxes size={17} /> Quản lý tồn kho</Link>
            </section>

            {hasError && <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">Không tải được số liệu tồn kho. Hãy kiểm tra backend và quyền tài khoản Admin.</div>}

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, icon: Icon, color, detail }) => <article key={label} className="rounded-2xl border border-white/10 bg-[#102852] p-5 shadow-xl shadow-slate-950/10">
                    <div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-400">{label}</p><p className="mt-3 text-3xl font-extrabold text-white">{loading ? "—" : value}</p></div><span className={`grid size-11 place-items-center rounded-xl ${color} text-white`}><Icon size={21} /></span></div>
                    <p className="mt-4 text-xs text-slate-400">{detail}</p>
                </article>)}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
                <article className="rounded-2xl border border-white/10 bg-[#102852] p-5 sm:p-6">
                    <div className="flex items-center justify-between"><div><h2 className="font-bold text-white">Tổng quan tồn kho</h2><p className="mt-1 text-sm text-slate-400">Sản phẩm có số lượng sẵn sàng bán cao nhất</p></div><TrendingUp className="text-cyan-300" /></div>
                    <div className="mt-7 space-y-5">
                        {(loading ? Array.from({ length: 5 }) : [...items].sort((first, second) => second.availableQuantity - first.availableQuantity).slice(0, 5)).map((item, index) => {
                            const inventory = item as InventoryItem | undefined;
                            const max = Math.max(...items.map((entry) => entry.availableQuantity), 1);
                            const width = inventory ? Math.max((inventory.availableQuantity / max) * 100, 4) : 60 - index * 8;
                            return <div key={inventory?.productId ?? index} className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-5 gap-y-2">
                                <span className={`truncate text-sm font-semibold ${inventory ? "text-slate-200" : "h-4 w-40 animate-pulse rounded bg-white/10"}`}>{inventory?.productName}</span>
                                <span className="text-sm font-bold text-cyan-300">{inventory ? numberFormatter.format(inventory.availableQuantity) : ""}</span>
                                <div className="col-span-2 h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400" style={{ width: `${width}%` }} /></div>
                            </div>;
                        })}
                    </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#163568] to-[#102852] p-6">
                    <span className="grid size-11 place-items-center rounded-xl bg-cyan-400 text-[#071a3a]"><CircleDollarSign size={23} /></span>
                    <h2 className="mt-5 text-xl font-extrabold text-white">Quản lý đơn hàng</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Xem chi tiết đơn mới, theo dõi thanh toán và cập nhật tiến trình giao hàng ngay tại một nơi.</p>
                    <Link to="/admin/orders" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-cyan-200">Đi đến đơn hàng <ArrowRight size={16} /></Link>
                </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-2xl border border-white/10 bg-[#102852] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-white">Danh mục bán chạy</h2><p className="mt-1 text-sm text-slate-400">Tỷ trọng sản phẩm đã bán theo danh mục</p></div><span className="rounded-lg bg-cyan-400/10 px-2.5 py-1 text-xs font-bold text-cyan-300">Tháng này</span></div>
                    <div className="mt-6 flex flex-col items-center gap-7 sm:flex-row sm:justify-around">
                        <div className="relative grid size-48 place-items-center rounded-full" style={{ background: "conic-gradient(#22d3ee 0% 42%, #818cf8 42% 70%, #fbbf24 70% 88%, #f472b6 88% 100%)" }}>
                            <div className="grid size-32 place-items-center rounded-full bg-[#102852] text-center"><span><strong className="block text-2xl text-white">1.248</strong><small className="text-xs text-slate-400">sản phẩm bán</small></span></div>
                        </div>
                        <div className="w-full space-y-3 sm:w-48">{topCategories.map((category) => <div key={category.name} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2 text-slate-300"><i className="size-2.5 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</span><strong className="text-white">{category.value}%</strong></div>)}</div>
                    </div>
                </article>

                <article className="rounded-2xl border border-white/10 bg-[#102852] p-5 sm:p-6">
                    <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-white">Doanh thu theo tháng</h2><p className="mt-1 text-sm text-slate-400">Xu hướng doanh thu trong năm hiện tại</p></div><span className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-xs font-bold text-emerald-300">+18,4%</span></div>
                    <div className="mt-5 flex items-end justify-between"><div><p className="text-3xl font-extrabold text-white">128,6 triệu</p><p className="mt-1 text-xs text-emerald-300">↑ 18,4% so với tháng trước</p></div><p className="text-xs text-slate-500">Đơn vị: triệu đồng</p></div>
                    <div className="mt-4 h-52"><svg viewBox="0 0 360 180" className="size-full overflow-visible" role="img" aria-label="Biểu đồ doanh thu tăng giảm theo tháng"><defs><linearGradient id="revenueArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#22d3ee" stopOpacity="0.35" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient></defs>{[35, 75, 115, 155].map((line) => <line key={line} x1="20" x2="340" y1={line} y2={line} stroke="rgba(255,255,255,0.1)" strokeDasharray="3 4" />)}<path d={`${revenuePath} L 340 170 L 20 170 Z`} fill="url(#revenueArea)" /><path d={revenuePath} fill="none" stroke="#22d3ee" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />{monthlyRevenue.map((value, index) => { const x = 20 + index * (320 / 11); const y = 160 - ((value - 30) / 110) * 125; return <circle key={index} cx={x} cy={y} r="3.5" fill="#102852" stroke="#67e8f9" strokeWidth="2" />; })}</svg></div>
                    <div className="grid grid-cols-12 text-center text-[10px] font-medium text-slate-500">{["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"].map((month) => <span key={month}>{month}</span>)}</div>
                </article>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#102852]">
                <div className="flex items-center justify-between border-b border-white/10 p-5 sm:px-6"><div><h2 className="font-bold text-white">Cảnh báo tồn kho</h2><p className="mt-1 text-sm text-slate-400">Các mặt hàng cần được nhập thêm sớm.</p></div><Link to="/admin/inventory?filter=low" className="text-sm font-bold text-cyan-300 hover:text-cyan-200">Xem tất cả</Link></div>
                <div className="divide-y divide-white/8">{!loading && items.filter((item) => item.lowStock).slice(0, 4).map((item) => <div key={item.productId} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate font-semibold text-slate-100">{item.productName}</p><p className="mt-1 text-xs text-slate-400">Mã sản phẩm #{item.productId}</p></div><span className="rounded-lg bg-rose-400/15 px-3 py-1.5 text-sm font-bold text-rose-300">Còn {item.availableQuantity}</span></div>)}{!loading && !items.some((item) => item.lowStock) && <p className="px-6 py-7 text-center text-sm text-slate-400">Tồn kho đang ở mức an toàn.</p>}</div>
            </section>
        </div>
    );
}
