import { Minus, PackageOpen, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { formatProductImageUrl } from "../../lib/image";
import { useCartStore } from "../../store/cartStore";

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);

export default function CartPage() {
    const items = useCartStore((state) => state.items);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (!items.length) return <EmptyCart />;
    return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-600">Giỏ hàng của bạn</p><h1 className="mt-2 text-3xl font-black">Sẵn sàng để thanh toán</h1><div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{items.map((item) => <article key={item.productId} className="flex gap-4 border-b border-slate-100 p-4 last:border-0 sm:p-5"><img src={formatProductImageUrl(item.thumbnailUrl)} alt={item.name} className="h-24 w-24 rounded-xl object-cover" onError={(e) => { const t = e.currentTarget; if (!t.src.includes("placehold.co")) t.src = "https://placehold.co/160x160/f1f5f9/64748b?text=ShopNova"; }} /><div className="min-w-0 flex-1"><p className="line-clamp-2 font-bold text-slate-900">{item.name}</p><p className="mt-1 font-black text-indigo-700">{formatPrice(item.price)}</p><p className="mt-1 text-xs text-slate-500">Còn tối đa {item.stockQuantity} sản phẩm</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center rounded-lg border border-slate-200"><button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-2 text-slate-500 hover:bg-slate-50"><Minus size={15} /></button><span className="w-8 text-center text-sm font-bold">{item.quantity}</span><button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stockQuantity} className="p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"><Plus size={15} /></button></div><button type="button" onClick={() => removeItem(item.productId)} className="inline-flex items-center gap-1 text-sm font-bold text-rose-600 hover:text-rose-800"><Trash2 size={16} /> Xóa</button></div></div></article>)}</div><OrderSummary total={total} itemCount={items.length} /></div></section>;
}

function OrderSummary({ total, itemCount }: { total: number; itemCount: number }) {
    const shippingFee = 20000;
    const finalTotal = total + shippingFee;
    return (
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900">Tóm tắt đơn hàng</h2>
            <div className="mt-5 space-y-3 border-b border-slate-100 pb-4 text-sm">
                <div className="flex justify-between text-slate-600">
                    <span>{itemCount} sản phẩm</span>
                    <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-bold text-slate-800">{formatPrice(shippingFee)}</span>
                </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
                <div>
                    <span className="block font-bold text-slate-800">Tổng thanh toán</span>
                    <span className="block text-xs text-slate-400">(Đã gồm phí vận chuyển)</span>
                </div>
                <span className="text-xl font-black text-indigo-700">{formatPrice(finalTotal)}</span>
            </div>
            <Link
                to="/checkout"
                className="mt-5 block rounded-xl bg-indigo-600 py-3 text-center font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700"
            >
                Tiến hành thanh toán
            </Link>
            <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-slate-500">
                <ShieldCheck size={17} className="shrink-0 text-emerald-600" /> Thông tin thanh toán được bảo mật.
            </p>
        </aside>
    );
}
function EmptyCart() { return <section className="mx-auto grid max-w-7xl place-items-center px-4 py-20 text-center"><div><span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-indigo-50 text-indigo-600"><PackageOpen size={30} /></span><h1 className="mt-5 text-2xl font-black">Giỏ hàng đang trống</h1><p className="mt-2 text-slate-600">Hãy khám phá và thêm những sản phẩm bạn yêu thích.</p><Link to="/products" className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">Khám phá sản phẩm</Link></div></section>; }
