import { AlertTriangle, Boxes, Edit3, PackagePlus, Search } from "lucide-react";
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

    const loadInventory = useCallback(() => {
        setLoading(true);
        adminService.getInventories(lowStockOnly)
            .then((page) => setItems(page.content))
            .catch(() => toast.error("Không tải được dữ liệu tồn kho. Hãy kiểm tra quyền Admin."))
            .finally(() => setLoading(false));
    }, [lowStockOnly]);
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

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
                <h2 className="font-bold text-slate-900">Lọc tồn kho theo danh mục</h2>
                <p className="mt-1 text-sm text-slate-500">Hiển thị {shownItems.length} mặt hàng phù hợp.</p>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setSelectedCategoryId("all")}
                        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition ${selectedCategoryId === "all" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"}`}
                    >
                        Tất cả
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => setSelectedCategoryId(category.id)}
                            className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition ${selectedCategoryId === category.id ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"}`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </section>

            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Kho hàng</p>
                    <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Quản lý tồn kho</h1>
                    <p className="mt-1.5 text-sm text-slate-500">Kiểm soát số lượng sản phẩm và bổ sung hàng kịp thời.</p>
                </div>
                <button
                    onClick={() => loadInventory()}
                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                    <Boxes size={17} /> Đồng bộ kho
                </button>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Tổng mặt hàng</p>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900">{items.length}</p>
                </article>
                <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">Sẵn sàng bán</p>
                    <p className="mt-2 text-3xl font-extrabold text-blue-600">{items.reduce((total, item) => total + item.availableQuantity, 0)}</p>
                </article>
                <article className="rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-rose-700">Sắp hết hàng</p>
                    <p className="mt-2 text-3xl font-extrabold text-rose-600">{items.filter((item) => item.lowStock).length}</p>
                </article>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row">
                    <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-800">
                        <Search size={18} className="text-slate-400" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                            placeholder="Tìm tên sản phẩm"
                        />
                    </label>
                    <button
                        onClick={() => setLowStockOnly(!lowStockOnly)}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${lowStockOnly ? "border-rose-300 bg-rose-50 text-rose-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"}`}
                    >
                        <AlertTriangle size={17} /> Chỉ hàng sắp hết
                    </button>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left text-sm">
                        <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Sản phẩm</th>
                                <th className="px-6 py-4">Tổng kho</th>
                                <th className="px-6 py-4">Đã giữ</th>
                                <th className="px-6 py-4">Sẵn sàng bán</th>
                                <th className="px-6 py-4">Cập nhật gần nhất</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400">Đang tải tồn kho...</td></tr>
                            ) : shownItems.map((item) => (
                                <tr key={item.productId} className="text-slate-700 hover:bg-slate-50/80 transition">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-slate-900">{item.productName}</p>
                                        <p className="mt-0.5 text-xs text-slate-400">Mã #{item.productId}</p>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">{item.quantity}</td>
                                    <td className="px-6 py-4 text-slate-500">{item.reservedQuantity}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${item.lowStock ? "bg-rose-50 border border-rose-200 text-rose-700" : "bg-emerald-50 border border-emerald-200 text-emerald-700"}`}>
                                            {item.availableQuantity} {item.lowStock ? "• Sắp hết" : "• Ổn định"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("vi-VN") : "—"}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => openEditor(item, "restock")}
                                                className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                                            >
                                                <PackagePlus size={14} /> Nhập hàng
                                            </button>
                                            <button
                                                onClick={() => openEditor(item, "set")}
                                                aria-label="Chỉnh sửa tồn kho"
                                                className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50 transition"
                                            >
                                                <Edit3 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && !shownItems.length && (
                                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400">Không tìm thấy sản phẩm phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {editingItem && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <h2 className="text-xl font-extrabold text-slate-900">
                            {mode === "restock" ? "Nhập thêm hàng" : "Thiết lập số lượng kho"}
                        </h2>
                        <p className="mt-1.5 text-sm text-slate-500">{editingItem.productName}</p>
                        <label className="mt-5 block text-sm font-semibold text-slate-700">
                            {mode === "restock" ? "Số lượng nhập thêm" : "Tổng số lượng trong kho"}
                            <input
                                autoFocus
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(event) => setQuantity(Number(event.target.value))}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-500 focus:bg-white"
                            />
                        </label>
                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                onClick={() => setEditingItem(null)}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Hủy
                            </button>
                            <button
                                disabled={saving}
                                onClick={saveStock}
                                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
                            >
                                {saving ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
