import { Edit3, ImagePlus, PackagePlus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { adminService } from "../../service/adminService";
import { catalogService } from "../../service/catalogService";
import type { Category, ProductSummary } from "../../types/catalog";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export default function AdminProductsPage() {
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
    const [open, setOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", price: "", categoryId: "", initialQuantity: "0", imageUrls: "" });

    const load = () => {
        void catalogService.getProducts({ page: 0, size: 50 }).then((page) => setProducts(page.content));
        void catalogService.getCategories().then(setCategories);
    };
    useEffect(() => { load(); }, []);

    const filteredProducts = useMemo(
        () => selectedCategoryId === "all" ? products : products.filter((product) => product.categoryId === selectedCategoryId),
        [products, selectedCategoryId],
    );
    const change = (key: keyof typeof form, value: string) => setForm((old) => ({ ...old, [key]: value }));
    const saveProduct = async () => {
        if (!form.name || !form.description || !form.price || !form.categoryId) return toast.error("Vui lòng điền đủ thông tin bắt buộc");
        try {
            setSaving(true);
            if (editingProductId) {
                await adminService.updateProduct(editingProductId, { name: form.name, description: form.description, price: Number(form.price), categoryId: Number(form.categoryId), imageUrls: form.imageUrls.split("\n").map((url) => url.trim()).filter(Boolean) });
                toast.success("Đã cập nhật sản phẩm");
            } else {
                await adminService.createProduct({ name: form.name, description: form.description, price: Number(form.price), categoryId: Number(form.categoryId), initialQuantity: Number(form.initialQuantity), imageUrls: form.imageUrls.split("\n").map((url) => url.trim()).filter(Boolean) });
                toast.success("Đã tạo sản phẩm");
            }
            setOpen(false);
            setEditingProductId(null);
            setForm({ name: "", description: "", price: "", categoryId: "", initialQuantity: "0", imageUrls: "" });
            load();
        } catch { toast.error(editingProductId ? "Không thể cập nhật sản phẩm" : "Không thể tạo sản phẩm"); } finally { setSaving(false); }
    };

    const openEditor = async (product: ProductSummary) => {
        try {
            const details = await catalogService.getProduct(String(product.id));
            setEditingProductId(product.id);
            setForm({ name: details.name, description: details.description || "", price: String(details.price), categoryId: String(details.category.id), initialQuantity: String(product.stockQuantity), imageUrls: details.images.map((image) => image.url).join("\n") });
            setOpen(true);
        } catch { toast.error("Không tải được thông tin sản phẩm"); }
    };

    const openCreator = () => {
        setEditingProductId(null);
        setForm({ name: "", description: "", price: "", categoryId: "", initialQuantity: "0", imageUrls: "" });
        setOpen(true);
    };

    return <div className="space-y-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-cyan-300">Sản phẩm</p><h1 className="mt-1 text-3xl font-extrabold text-white">Quản lý sản phẩm</h1><p className="mt-2 text-sm text-slate-400">Thêm sản phẩm mới và gán sản phẩm vào danh mục phù hợp.</p></div><button onClick={openCreator} className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#071a3a]"><PackagePlus size={17} /> Thêm sản phẩm</button></section>

        <section className="rounded-2xl border border-white/10 bg-[#102852] p-4 sm:p-5"><div><h2 className="font-bold text-white">Lọc theo danh mục</h2><p className="mt-1 text-sm text-slate-400">Hiển thị {filteredProducts.length} sản phẩm phù hợp.</p></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setSelectedCategoryId("all")} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${selectedCategoryId === "all" ? "bg-cyan-400 text-[#071a3a]" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>Tất cả <span className="ml-1 opacity-70">{products.length}</span></button>{categories.map((category) => { const count = products.filter((product) => product.categoryId === category.id).length; return <button key={category.id} onClick={() => setSelectedCategoryId(category.id)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold ${selectedCategoryId === category.id ? "bg-cyan-400 text-[#071a3a]" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>{category.name} <span className="ml-1 opacity-70">{count}</span></button>; })}</div></section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{filteredProducts.map((product) => <article key={product.id} className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#102852]"><button onClick={() => openEditor(product)} aria-label={`Sửa ${product.name}`} className="absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-lg bg-[#071a3a]/90 text-cyan-300 shadow-lg transition hover:bg-cyan-400 hover:text-[#071a3a]"><Edit3 size={16} /></button><div className="grid h-36 place-items-center bg-white/5">{product.thumbnailUrl ? <img src={product.thumbnailUrl} alt={product.name} className="size-full object-cover" /> : <ImagePlus className="text-slate-600" size={28} />}</div><div className="p-4"><p className="text-xs font-bold text-cyan-300">{product.categoryName}</p><h2 className="mt-1 truncate font-bold text-white">{product.name}</h2><div className="mt-3 flex items-center justify-between"><span className="font-extrabold">{currency.format(product.price)}</span><span className="text-xs text-slate-400">Kho: {product.stockQuantity}</span></div></div></article>)}</section>
        {!filteredProducts.length && <div className="rounded-2xl border border-dashed border-white/15 py-16 text-center text-slate-400">Danh mục này chưa có sản phẩm.</div>}

        {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4"><div className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-white/10 bg-[#102852] p-6"><div className="flex items-center justify-between"><div><h2 className="text-xl font-extrabold">{editingProductId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}</h2><p className="mt-1 text-sm text-slate-400">Gán sản phẩm vào một danh mục có sẵn.</p></div><button onClick={() => setOpen(false)} aria-label="Đóng"><X /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Tên sản phẩm *"><input value={form.name} onChange={(event) => change("name", event.target.value)} /></Field><Field label="Danh mục *"><select value={form.categoryId} onChange={(event) => change("categoryId", event.target.value)}><option value="">Chọn danh mục</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field><Field label="Giá bán (VNĐ) *"><input type="number" min="1" value={form.price} onChange={(event) => change("price", event.target.value)} /></Field>{!editingProductId && <Field label="Số lượng ban đầu"><input type="number" min="0" value={form.initialQuantity} onChange={(event) => change("initialQuantity", event.target.value)} /></Field>}<div className="sm:col-span-2"><Field label="Mô tả *"><textarea rows={4} value={form.description} onChange={(event) => change("description", event.target.value)} /></Field></div><div className="sm:col-span-2"><Field label="URL ảnh (mỗi URL một dòng, tối đa 10 ảnh)"><textarea rows={3} value={form.imageUrls} onChange={(event) => change("imageUrls", event.target.value)} placeholder="https://..." /></Field></div></div><div className="mt-6 flex justify-end gap-3"><button onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 font-bold text-slate-300 hover:bg-white/10">Hủy</button><button disabled={saving} onClick={saveProduct} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 font-bold text-[#071a3a]"><Plus size={16} /> {saving ? "Đang lưu..." : editingProductId ? "Lưu thay đổi" : "Tạo sản phẩm"}</button></div></div></div>}
    </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return <label className="block text-sm font-semibold text-slate-200">{label}<span className="mt-2 block [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-white/10 [&_input]:bg-[#0b2148] [&_input]:px-3 [&_input]:py-2.5 [&_input]:outline-none [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-white/10 [&_select]:bg-[#0b2148] [&_select]:px-3 [&_select]:py-2.5 [&_select]:outline-none [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-white/10 [&_textarea]:bg-[#0b2148] [&_textarea]:px-3 [&_textarea]:py-2.5 [&_textarea]:outline-none">{children}</span></label>;
}
