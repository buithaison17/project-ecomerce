import { AlertTriangle, Boxes, ChevronLeft, ChevronRight, Edit3, PackagePlus, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../../service/adminService";
import { catalogService } from "../../service/catalogService";
import type { InventoryItem } from "../../types/admin";
import type { Category, ProductSummary } from "../../types/catalog";

export default function AdminInventoryPage() {
    const [searchParams] = useSearchParams();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [lowStockOnly, setLowStockOnly] = useState(searchParams.get("filter") === "low");
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [quantity, setQuantity] = useState(0);
    const [mode, setMode] = useState<"restock" | "set">("restock");
    const [saving, setSaving] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");

    // Phân trang
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize] = useState(15);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);

    const loadInventory = useCallback(() => {
        setLoading(true);
        adminService.getInventories(lowStockOnly, currentPage, pageSize)
            .then((pageData) => {
                setItems(pageData.content || []);
                setTotalPages(pageData.totalPages || 1);
                setTotalElements(pageData.totalElements ?? (pageData.content?.length || 0));
            })
            .catch(() => toast.error("Không tải được dữ liệu tồn kho. Hãy kiểm tra quyền Admin."))
            .finally(() => setLoading(false));
    }, [lowStockOnly, currentPage, pageSize]);
    useEffect(() => {
        void Promise.resolve().then(loadInventory);
    }, [loadInventory]);
    useEffect(() => {
        void catalogService.getCategories().then(setCategories);
        void catalogService.getProducts({ page: 0, size: 100 }).then((page) => setProducts(page.content));
    }, []);

    const openEditor = (item: InventoryItem, nextMode: "restock" | "set") => {
        setEditingItem(item);
        setMode(nextMode);
        setQuantity(nextMode === "set" ? item.quantity : 1);
    };
    const saveStock = async () => {
        if (!editingItem || quantity < 0 || (mode === "restock" && quantity === 0)) return;
        try {
            setSaving(true);
            if (mode === "restock") await adminService.restock(editingItem.productId, quantity);
            else await adminService.updateStock(editingItem.productId, quantity);
            toast.success(mode === "restock" ? "Đã nhập thêm hàng vào kho" : "Đã cập nhật số lượng tồn kho");
            setEditingItem(null);
            loadInventory();
        } catch {
            toast.error("Không thể cập nhật tồn kho");
        } finally { setSaving(false); }
    };
    const productCategories = useMemo(() => new Map(products.map((product) => [product.id, product.categoryId])), [products]);
    const shownItems = items.filter((item) => item.productName.toLowerCase().includes(search.toLowerCase()) && (selectedCategoryId === "all" || productCategories.get(item.productId) === selectedCategoryId));

    return <div className="space-y-6">
        <section className="rounded-2xl border border-white/10 bg-[#102852] p-4 sm:p-5"><h2 className="font-bold text-white">Lọc tồn kho theo danh mục</h2><p className="mt-1 text-sm text-slate-400">Hiển thị {shownItems.length} mặt hàng phù hợp.</p><div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setSelectedCategoryId("all")} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${selectedCategoryId === "all" ? "bg-cyan-400 text-[#071a3a]" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>Tất cả</button>{categories.map((category) => <button key={category.id} onClick={() => setSelectedCategoryId(category.id)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${selectedCategoryId === category.id ? "bg-cyan-400 text-[#071a3a]" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>{category.name}</button>)}</div></section>
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-cyan-300">Kho hàng</p><h1 className="mt-1 text-3xl font-extrabold text-white">Quản lý tồn kho</h1><p className="mt-2 text-sm text-slate-400">Kiểm soát số lượng sản phẩm và bổ sung hàng kịp thời.</p></div><button onClick={() => loadInventory()} className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#071a3a] hover:bg-cyan-300"><Boxes size={17} /> Đồng bộ kho</button></section>
        <section className="grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-white/10 bg-[#102852] p-5"><p className="text-sm text-slate-400">Tổng mặt hàng</p><p className="mt-2 text-3xl font-extrabold">{items.length}</p></article><article className="rounded-2xl border border-white/10 bg-[#102852] p-5"><p className="text-sm text-slate-400">Sẵn sàng bán</p><p className="mt-2 text-3xl font-extrabold text-cyan-300">{items.reduce((total, item) => total + item.availableQuantity, 0)}</p></article><article className="rounded-2xl border border-rose-400/20 bg-rose-400/8 p-5"><p className="text-sm text-rose-200">Sắp hết hàng</p><p className="mt-2 text-3xl font-extrabold text-rose-200">{items.filter((item) => item.lowStock).length}</p></article></section>
        <section className="rounded-2xl border border-white/10 bg-[#102852] p-4 sm:p-5"><div className="flex flex-col gap-3 md:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-[#0b2148] px-3 py-2.5"><Search size={18} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" placeholder="Tìm tên sản phẩm" /></label><button onClick={() => { setLowStockOnly(!lowStockOnly); setCurrentPage(0); }} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${lowStockOnly ? "border-rose-400 bg-rose-400 text-[#071a3a]" : "border-white/10 text-slate-300 hover:bg-white/10"}`}><AlertTriangle size={17} /> Chỉ hàng sắp hết</button></div></section>
        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#102852]">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                    <thead className="bg-white/4 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                            <th className="px-6 py-4">Sản phẩm</th>
                            <th className="px-6 py-4">Tổng kho</th>
                            <th className="px-6 py-4">Đã giữ</th>
                            <th className="px-6 py-4">Sẵn sàng bán</th>
                            <th className="px-6 py-4">Cập nhật gần nhất</th>
                            <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/8">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-slate-400">Đang tải tồn kho...</td>
                            </tr>
                        ) : shownItems.map((item) => (
                            <tr key={item.productId} className="hover:bg-white/3">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-100">{item.productName}</p>
                                    <p className="mt-1 text-xs text-slate-500">Mã #{item.productId}</p>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-200">{item.quantity}</td>
                                <td className="px-6 py-4 text-slate-400">{item.reservedQuantity}</td>
                                <td className="px-6 py-4">
                                    <span className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${item.lowStock ? "bg-rose-400/15 text-rose-200" : "bg-emerald-400/15 text-emerald-200"}`}>
                                        {item.availableQuantity} {item.lowStock ? "• Sắp hết" : "• Ổn định"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-400">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("vi-VN") : "—"}</td>
                                <td className="px-6 py-4">
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => openEditor(item, "restock")} className="inline-flex items-center gap-1 rounded-lg bg-cyan-400 px-2.5 py-2 text-xs font-bold text-[#071a3a] hover:bg-cyan-300">
                                            <PackagePlus size={14} /> Nhập hàng
                                        </button>
                                        <button onClick={() => openEditor(item, "set")} aria-label="Chỉnh sửa tồn kho" className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10">
                                            <Edit3 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {!loading && !shownItems.length && (
                            <tr>
                                <td colSpan={6} className="px-6 py-16 text-center text-slate-400">Không tìm thấy sản phẩm phù hợp.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 text-sm text-slate-400">
                <span>
                    Hiển thị {shownItems.length} / tổng {totalElements} mặt hàng
                </span>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                        Trang {currentPage + 1} / {Math.max(1, totalPages)}
                    </span>
                    <button
                        disabled={currentPage <= 0 || loading}
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        className="rounded-lg border border-white/10 p-1.5 transition hover:bg-white/10 disabled:opacity-30"
                        title="Trang trước"
                    >
                        <ChevronLeft size={17} />
                    </button>
                    <button
                        disabled={currentPage >= totalPages - 1 || loading}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="rounded-lg border border-white/10 p-1.5 transition hover:bg-white/10 disabled:opacity-30"
                        title="Trang sau"
                    >
                        <ChevronRight size={17} />
                    </button>
                </div>
            </div>
        </section>
        {editingItem && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#102852] p-6 shadow-2xl"><h2 className="text-xl font-extrabold text-white">{mode === "restock" ? "Nhập thêm hàng" : "Thiết lập số lượng kho"}</h2><p className="mt-2 text-sm text-slate-400">{editingItem.productName}</p><label className="mt-5 block text-sm font-semibold text-slate-200">{mode === "restock" ? "Số lượng nhập thêm" : "Tổng số lượng trong kho"}<input autoFocus type="number" min="0" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b2148] px-3 py-2.5 text-white outline-none focus:border-cyan-400" /></label><div className="mt-6 flex justify-end gap-3"><button onClick={() => setEditingItem(null)} className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-white/10">Hủy</button><button disabled={saving} onClick={saveStock} className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#071a3a] disabled:opacity-60">{saving ? "Đang lưu..." : "Lưu thay đổi"}</button></div></div></div>}
    </div>;
}
