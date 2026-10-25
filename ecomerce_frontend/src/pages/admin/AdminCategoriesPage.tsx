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

    const loadCategories = () =>
        catalogService
            .getCategories()
            .then(setCategories)
            .catch(() => toast.error("Không tải được danh mục"));

    useEffect(() => {
        void Promise.resolve().then(loadCategories);
    }, []);

    const openForm = (category: Category | "new") => {
        setEditing(category);
        setName(category === "new" ? "" : category.name);
        setDescription(category === "new" ? "" : category.description || "");
    };

    const save = async () => {
        if (!name.trim()) return toast.error("Vui lòng nhập tên danh mục");
        try {
            setSaving(true);
            if (editing === "new") {
                await adminService.createCategory({ name: name.trim(), description: description.trim() });
            } else if (editing) {
                await adminService.updateCategory(editing.id, { name: name.trim(), description: description.trim() });
            }
            toast.success(editing === "new" ? "Đã thêm danh mục mới thành công" : "Đã cập nhật danh mục");
            setEditing(null);
            loadCategories();
        } catch {
            toast.error("Không thể lưu danh mục");
        } finally {
            setSaving(false);
        }
    };

    const remove = async (category: Category) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa danh mục “${category.name}”?`)) return;
        try {
            await adminService.deleteCategory(category.id);
            toast.success("Đã xóa danh mục thành công");
            loadCategories();
        } catch {
            toast.error("Không thể xóa danh mục đang có sản phẩm liên kết");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                        Quản lý catalogue
                    </span>
                    <h1 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
                        Danh mục sản phẩm
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                        Tạo và phân loại các ngành hàng giúp khách hàng dễ dàng tìm kiếm sản phẩm.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => openForm("new")}
                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 cursor-pointer"
                >
                    <FolderPlus size={16} /> Thêm danh mục mới
                </button>
            </section>

            {/* Grid list of categories */}
            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {categories.map((category) => (
                    <article
                        key={category.id}
                        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-indigo-200 hover:shadow-md"
                    >
                        <div>
                            <div className="flex items-start justify-between">
                                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                                    <Layers3 size={20} />
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        aria-label="Sửa danh mục"
                                        onClick={() => openForm(category)}
                                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition"
                                    >
                                        <Edit3 size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Xóa danh mục"
                                        onClick={() => remove(category)}
                                        className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                            <h2 className="mt-4 text-base font-extrabold text-slate-900">
                                {category.name}
                            </h2>
                            <p className="mt-1.5 text-xs text-slate-500 leading-relaxed line-clamp-3">
                                {category.description || "Chưa có mô tả cho ngành hàng này."}
                            </p>
                        </div>

                        <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Mã danh mục #{category.id}</span>
                            <span className="font-semibold text-indigo-600">Đang hoạt động</span>
                        </div>
                    </article>
                ))}

                {!categories.length && (
                    <p className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-xs text-slate-400">
                        Chưa có danh mục sản phẩm nào trong hệ thống.
                    </p>
                )}
            </section>

            {/* Modal Form */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-in fade-in">
                    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <h2 className="text-base font-extrabold text-slate-900">
                                {editing === "new" ? "Thêm danh mục mới" : "Chỉnh sửa danh mục"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 space-y-4">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Tên danh mục *
                                <input
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    placeholder="Ví dụ: Thiết bị di động"
                                    className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium outline-none transition focus:border-indigo-500 focus:bg-white"
                                />
                            </label>

                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Mô tả ngành hàng
                                <textarea
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                    rows={4}
                                    placeholder="Nhập mô tả ngắn gọn về nhóm sản phẩm này..."
                                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-medium outline-none transition focus:border-indigo-500 focus:bg-white"
                                />
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={save}
                                className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50"
                            >
                                {saving ? "Đang lưu..." : "Lưu danh mục"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
