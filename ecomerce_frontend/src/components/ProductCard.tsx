import { ArrowUpRight, PackageOpen } from "lucide-react";
import { Link } from "react-router-dom";
import type { ProductSummary } from "../types/catalog";

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);

export default function ProductCard({ product }: { product: ProductSummary }) {
    const imageUrl = product.thumbnailUrl || "https://placehold.co/600x600/f1f5f9/64748b?text=ShopNova";
    return <Link to={`/products/${product.id}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70"><div className="relative aspect-square overflow-hidden bg-slate-100"><img src={imageUrl} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className={product.inStock ? "absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm" : "absolute left-3 top-3 rounded-full bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"}>{product.inStock ? "Còn hàng" : "Tạm hết hàng"}</span><span className="absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-900 shadow-lg opacity-0 transition group-hover:opacity-100"><ArrowUpRight size={18} /></span></div><div className="p-4"><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{product.categoryName}</p><h2 className="mt-2 line-clamp-2 min-h-12 font-bold leading-6 text-slate-800 transition group-hover:text-indigo-600">{product.name}</h2><div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-xs text-slate-400">Giá sản phẩm</p><p className="mt-0.5 font-black text-slate-950">{formatPrice(product.price)}</p></div><p className={product.inStock ? "text-xs font-semibold text-emerald-600" : "text-xs font-semibold text-rose-600"}>{product.inStock ? `Còn ${product.stockQuantity}` : "Hết hàng"}</p></div></div></Link>;
}

export function EmptyProducts() {
    return <div className="col-span-full grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><PackageOpen size={28} /></span><h2 className="mt-4 text-lg font-black">Không tìm thấy sản phẩm</h2><p className="mt-2 text-sm text-slate-500">Hãy thử thay đổi từ khóa hoặc điều kiện lọc của bạn.</p></div></div>;
}
