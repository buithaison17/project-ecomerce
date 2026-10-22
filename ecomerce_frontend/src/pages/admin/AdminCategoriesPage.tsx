import { Edit3, FolderPlus, Layers3, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { adminService } from "../../service/adminService";
import { catalogService } from "../../service/catalogService";
import type { Category } from "../../types/catalog";

export default function AdminCategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [editing, setEditing] = useState<Category | null | "new">(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    const loadCategories = () => catalogService.getCategories().then(setCategories).catch(() => toast.error("Không tải được danh mục"));
    useEffect(() => { void Promise.resolve().then(loadCategories); }, []);
    const openForm = (category: Category | "new") => { setEditing(category); setName(category === "new" ? "" : category.name); setDescription(category === "new" ? "" : category.description || ""); };
    const save = async () => {
        if (!name.trim()) return toast.error("Vui lòng nhập tên danh mục");
        try { setSaving(true); if (editing === "new") await adminService.createCategory({ name, description }); else if (editing) await adminService.updateCategory(editing.id, { name, description }); toast.success(editing === "new" ? "Đã thêm danh mục" : "Đã cập nhật danh mục"); setEditing(null); loadCategories(); } catch { toast.error("Không thể lưu danh mục"); } finally { setSaving(false); }
    };
    const remove = async (category: Category) => { if (!window.confirm(`Xóa danh mục “${category.name}”?`)) return; try { await adminService.deleteCategory(category.id); toast.success("Đã xóa danh mục"); loadCategories(); } catch { toast.error("Không thể xóa danh mục đang có sản phẩm"); } };

    return <div className="space-y-6"><section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-cyan-300">Sản phẩm</p><h1 className="mt-1 text-3xl font-extrabold text-white">Quản lý danh mục</h1><p className="mt-2 text-sm text-slate-400">Tạo các nhóm sản phẩm để khách hàng dễ tìm kiếm.</p></div><button onClick={() => openForm("new")} className="inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-bold text-[#071a3a]"><FolderPlus size={17} /> Thêm danh mục</button></section><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{categories.map((category) => <article key={category.id} className="rounded-2xl border border-white/10 bg-[#102852] p-5"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-xl bg-violet-400/15 text-violet-300"><Layers3 size={21} /></span><div className="flex gap-1"><button aria-label="Sửa danh mục" onClick={() => openForm(category)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10"><Edit3 size={16} /></button><button aria-label="Xóa danh mục" onClick={() => remove(category)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10"><Trash2 size={16} /></button></div></div><h2 className="mt-5 font-bold text-white">{category.name}</h2><p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">{category.description || "Chưa có mô tả cho danh mục này."}</p></article>)}{!categories.length && <p className="col-span-full rounded-2xl border border-dashed border-white/15 py-16 text-center text-slate-400">Chưa có danh mục nào.</p>}</section>{editing && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4"><div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#102852] p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">{editing === "new" ? "Thêm danh mục" : "Cập nhật danh mục"}</h2><button onClick={() => setEditing(null)}><X /></button></div><label className="mt-5 block text-sm font-semibold">Tên danh mục<input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b2148] px-3 py-2.5 outline-none focus:border-cyan-400" /></label><label className="mt-4 block text-sm font-semibold">Mô tả<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#0b2148] px-3 py-2.5 outline-none focus:border-cyan-400" /></label><div className="mt-6 flex justify-end gap-3"><button onClick={() => setEditing(null)} className="rounded-xl px-4 py-2.5 font-bold text-slate-300 hover:bg-white/10">Hủy</button><button disabled={saving} onClick={save} className="rounded-xl bg-cyan-400 px-4 py-2.5 font-bold text-[#071a3a] disabled:opacity-50">{saving ? "Đang lưu..." : "Lưu danh mục"}</button></div></div></div>}</div>;
}
