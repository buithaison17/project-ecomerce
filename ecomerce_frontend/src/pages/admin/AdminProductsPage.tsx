import {
    Edit3,
    ImagePlus,
    PackagePlus,
    Plus,
    Star,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { adminService } from "../../service/adminService";
import { catalogService } from "../../service/catalogService";
import type { Category, ProductSummary } from "../../types/catalog";
import { resolveImageUrl } from "../../lib/image";

const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

interface ProductImageItem {
    id?: number;
    url: string;
    file?: File;
    isNew?: boolean;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | "all">("all");
    const [open, setOpen] = useState(false);
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: "", description: "", price: "", categoryId: "", initialQuantity: "0" });
    const [images, setImages] = useState<ProductImageItem[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFilesSelected = (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        const newItems: ProductImageItem[] = [];

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (!validTypes.includes(file.type)) {
                toast.error(`Tệp "${file.name}" không hợp lệ. Chỉ chấp nhận JPG, PNG, WEBP, GIF.`);
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error(`Tệp "${file.name}" quá lớn (tối đa 10MB).`);
                continue;
            }
            newItems.push({
                url: URL.createObjectURL(file),
                file,
                isNew: true,
            });
        }

        if (images.length + newItems.length > 10) {
            toast.error("Mỗi sản phẩm chỉ được tối đa 10 ảnh.");
            return;
        }

        setImages((prev) => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (indexToRemove: number) => {
        setImages((prev) => {
            const item = prev[indexToRemove];
            if (item.isNew && item.url.startsWith("blob:")) {
                URL.revokeObjectURL(item.url);
            }
            return prev.filter((_, idx) => idx !== indexToRemove);
        });
    };

    const setAsCover = (index: number) => {
        if (index === 0) return;
        setImages((prev) => {
            const next = [...prev];
            const [selected] = next.splice(index, 1);
            next.unshift(selected);
            return next;
        });
        toast.success("Đã chọn làm ảnh chính");
    };

    const saveProduct = async () => {
        if (!form.name.trim() || !form.description.trim() || !form.price || !form.categoryId) {
            return toast.error("Vui lòng điền đủ thông tin bắt buộc (*)");
        }
        try {
            setSaving(true);
            const finalUrls: string[] = [];

            // Upload any newly selected files
            for (const img of images) {
                if (img.isNew && img.file) {
                    const uploadedUrl = await adminService.uploadProductImage(img.file);
                    finalUrls.push(uploadedUrl);
                } else if (img.url) {
                    finalUrls.push(img.url);
                }
            }

            if (editingProductId) {
                await adminService.updateProduct(editingProductId, {
                    name: form.name,
                    description: form.description,
                    price: Number(form.price),
                    categoryId: Number(form.categoryId),
                    imageUrls: finalUrls,
                });
                toast.success("Đã cập nhật sản phẩm thành công");
            } else {
                await adminService.createProduct({
                    name: form.name,
                    description: form.description,
                    price: Number(form.price),
                    categoryId: Number(form.categoryId),
                    initialQuantity: Number(form.initialQuantity || 0),
                    imageUrls: finalUrls,
                });
                toast.success("Đã tạo sản phẩm thành công");
            }

            setOpen(false);
            setEditingProductId(null);
            setForm({ name: "", description: "", price: "", categoryId: "", initialQuantity: "0" });
            setImages([]);
            load();
        } catch {
            toast.error(editingProductId ? "Không thể cập nhật sản phẩm" : "Không thể tạo sản phẩm");
        } finally {
            setSaving(false);
        }
    };

    const openEditor = async (product: ProductSummary) => {
        try {
            const details = await catalogService.getProduct(String(product.id));
            setEditingProductId(product.id);
            setForm({
                name: details.name,
                description: details.description || "",
                price: String(details.price),
                categoryId: String(details.category.id),
                initialQuantity: String(product.stockQuantity),
            });
            const existingImages: ProductImageItem[] = (details.images || []).map((image) => ({
                id: image.id,
                url: image.url,
                isNew: false,
            }));
            if (existingImages.length === 0 && details.thumbnailUrl) {
                existingImages.push({ url: details.thumbnailUrl, isNew: false });
            }
            setImages(existingImages);
            setOpen(true);
        } catch {
            toast.error("Không tải được thông tin sản phẩm");
        }
    };

    const openCreator = () => {
        setEditingProductId(null);
        setForm({ name: "", description: "", price: "", categoryId: "", initialQuantity: "0" });
        setImages([]);
        setOpen(true);
    };

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-blue-600">Sản phẩm</p>
                    <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Quản lý sản phẩm</h1>
                    <p className="mt-1.5 text-sm text-slate-500">Thêm sản phẩm mới và gán sản phẩm vào danh mục phù hợp.</p>
                </div>
                <button
                    onClick={openCreator}
                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                    <PackagePlus size={17} /> Thêm sản phẩm
                </button>
            </section>

            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm">
                <div>
                    <h2 className="font-bold text-slate-900">Lọc theo danh mục</h2>
                    <p className="mt-1 text-sm text-slate-500">Hiển thị {filteredProducts.length} sản phẩm phù hợp.</p>
                </div>
                <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setSelectedCategoryId("all")}
                        className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition ${selectedCategoryId === "all" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"}`}
                    >
                        Tất cả <span className="ml-1 opacity-70">{products.length}</span>
                    </button>
                    {categories.map((category) => {
                        const count = products.filter((product) => product.categoryId === category.id).length;
                        return (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategoryId(category.id)}
                                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-bold transition ${selectedCategoryId === category.id ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"}`}
                            >
                                {category.name} <span className="ml-1 opacity-70">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                    <article key={product.id} className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:shadow-md">
                        <button
                            onClick={() => openEditor(product)}
                            aria-label={`Sửa ${product.name}`}
                            className="absolute left-3 top-3 z-10 grid size-9 place-items-center rounded-lg bg-white/95 text-slate-700 shadow-md border border-slate-200 transition hover:bg-blue-600 hover:text-white"
                        >
                            <Edit3 size={16} />
                        </button>
                        <div className="grid h-36 place-items-center bg-slate-100">
                            {product.thumbnailUrl ? (
                                <img src={resolveImageUrl(product.thumbnailUrl)} alt={product.name} className="size-full object-cover" />
                            ) : (
                                <ImagePlus className="text-slate-400" size={28} />
                            )}
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-bold text-blue-600">{product.categoryName}</p>
                            <h2 className="mt-1 truncate font-bold text-slate-900">{product.name}</h2>
                            <div className="mt-3 flex items-center justify-between">
                                <span className="font-extrabold text-slate-900">{currency.format(product.price)}</span>
                                <span className="text-xs text-slate-500">Kho: {product.stockQuantity}</span>
                            </div>
                        </div>
                    </article>
                ))}
            </section>
            {!filteredProducts.length && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">
                    Danh mục này chưa có sản phẩm.
                </div>
            )}

            {open && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 backdrop-blur-sm p-4">
                    <div className="mx-auto my-6 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">
                                    {editingProductId ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">Nhập thông tin và tải ảnh từ máy tính lên cửa hàng.</p>
                            </div>
                            <button onClick={() => setOpen(false)} aria-label="Đóng" className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <Field label="Tên sản phẩm *"><input value={form.name} onChange={(event) => change("name", event.target.value)} placeholder="Nhập tên sản phẩm..." /></Field>
                            <Field label="Danh mục *">
                                <select value={form.categoryId} onChange={(event) => change("categoryId", event.target.value)}>
                                    <option value="">Chọn danh mục</option>
                                    {categories.map((category) => (
                                        <option key={category.id} value={category.id}>{category.name}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Giá bán (VNĐ) *"><input type="number" min="1" value={form.price} onChange={(event) => change("price", event.target.value)} placeholder="0" /></Field>
                            {!editingProductId && <Field label="Số lượng ban đầu"><input type="number" min="0" value={form.initialQuantity} onChange={(event) => change("initialQuantity", event.target.value)} placeholder="0" /></Field>}
                            <div className="sm:col-span-2">
                                <Field label="Mô tả sản phẩm *"><textarea rows={3} value={form.description} onChange={(event) => change("description", event.target.value)} placeholder="Nhập mô tả chi tiết sản phẩm..." /></Field>
                            </div>

                            {/* Section: Upload Image from Computer */}
                            <div className="sm:col-span-2 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Hình ảnh sản phẩm ({images.length}/10 ảnh)
                                    </label>
                                    {images.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                                        >
                                            <Plus size={14} /> Thêm ảnh từ máy
                                        </button>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    accept="image/png,image/jpeg,image/webp,image/gif"
                                    className="hidden"
                                    onChange={(event) => handleFilesSelected(event.target.files)}
                                />

                                {images.length === 0 ? (
                                    <div
                                        onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                                        onDragLeave={() => setIsDragging(false)}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            setIsDragging(false);
                                            handleFilesSelected(event.dataTransfer.files);
                                        }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition ${isDragging ? "border-blue-500 bg-blue-50/50" : "border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/20"}`}
                                    >
                                        <div className="grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600">
                                            <UploadCloud size={26} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">
                                            Bấm để chọn file ảnh hoặc kéo thả vào đây
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Hỗ trợ định dạng JPG, PNG, WEBP, GIF (Tối đa 10 ảnh, mỗi ảnh ≤ 10MB)
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {images.map((item, index) => (
                                            <div
                                                key={item.id ? `exist-${item.id}` : `new-${index}-${item.url}`}
                                                className={`group relative aspect-square overflow-hidden rounded-xl border bg-slate-100 ${index === 0 ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200"}`}
                                            >
                                                <img
                                                    src={resolveImageUrl(item.url)}
                                                    alt={`Ảnh sản phẩm ${index + 1}`}
                                                    className="size-full object-cover"
                                                />

                                                {/* Badge: Cover image */}
                                                {index === 0 && (
                                                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                                                        <Star size={10} fill="currentColor" /> Ảnh chính
                                                    </span>
                                                )}

                                                {/* Badge: New file from computer */}
                                                {item.isNew && index !== 0 && (
                                                    <span className="absolute left-2 top-2 rounded-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                                                        Mới
                                                    </span>
                                                )}

                                                {/* Actions Overlay */}
                                                <div className="absolute inset-0 flex flex-col justify-between bg-slate-950/40 p-2 opacity-0 transition group-hover:opacity-100">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                                            aria-label="Xóa ảnh"
                                                            className="grid size-7 place-items-center rounded-lg bg-rose-600 text-white shadow hover:bg-rose-700 transition"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                    {index !== 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setAsCover(index); }}
                                                            className="rounded-lg bg-white/95 px-2 py-1 text-center text-[10px] font-bold text-slate-800 shadow hover:bg-blue-600 hover:text-white transition"
                                                        >
                                                            Đặt làm ảnh chính
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Box to add more files if under 10 */}
                                        {images.length < 10 && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 hover:border-blue-500 hover:bg-blue-50/30 hover:text-blue-600 transition"
                                            >
                                                <Plus size={20} />
                                                <span className="text-xs font-semibold">Thêm ảnh</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={saveProduct}
                                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Plus size={16} /> {saving ? "Đang lưu..." : editingProductId ? "Lưu thay đổi" : "Tạo sản phẩm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block text-sm font-semibold text-slate-700">
            {label}
            <span className="mt-2 block [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-200 [&_input]:bg-slate-50 [&_input]:px-3.5 [&_input]:py-2.5 [&_input]:text-slate-900 [&_input]:outline-none [&_input]:focus:border-blue-500 [&_input]:focus:bg-white [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-200 [&_select]:bg-slate-50 [&_select]:px-3.5 [&_select]:py-2.5 [&_select]:text-slate-900 [&_select]:outline-none [&_select]:focus:border-blue-500 [&_select]:focus:bg-white [&_textarea]:w-full [&_textarea]:resize-none [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:bg-slate-50 [&_textarea]:px-3.5 [&_textarea]:py-2.5 [&_textarea]:text-slate-900 [&_textarea]:outline-none [&_textarea]:focus:border-blue-500 [&_textarea]:focus:bg-white">
                {children}
            </span>
        </label>
    );
}
