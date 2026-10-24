import { Minus, PackageOpen, Plus, ShieldCheck, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { resolveImageUrl } from "../../lib/image";

const formatPrice = (price: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(price);

export default function CartPage() {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const { items, updateQuantity, removeItem } = useCartStore();
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const checkout = () => {
        if (user) return navigate("/checkout");
        toast((toastItem) => <div><p className="font-bold text-slate-900">Bạn cần đăng nhập để thanh toán.</p><button onClick={() => { toast.dismiss(toastItem.id); navigate("/login", { state: { returnTo: "/cart" } }); }} className="mt-2 font-bold text-indigo-600 hover:underline">Đăng nhập ngay</button></div>, { duration: 6000 });
    };
    if (!items.length) return <section className="mx-auto grid max-w-7xl place-items-center px-4 py-20 text-center"><div><PackageOpen className="mx-auto text-indigo-600" size={44} /><h1 className="mt-5 text-2xl font-black">Giỏ hàng đang trống</h1><Link to="/products" className="mt-5 inline-block font-bold text-indigo-600">Khám phá sản phẩm</Link></div></section>;
    return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><p className="text-sm font-bold uppercase tracking-[.16em] text-indigo-600">Giỏ hàng của bạn</p><h1 className="mt-2 text-3xl font-black">Sẵn sàng để thanh toán</h1><div className="mt-7 grid gap-6 lg:grid-cols-[1fr_340px]"><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{items.map((item) => <article key={item.productId} className="flex gap-4 border-b border-slate-100 p-4 last:border-0 sm:p-5"><img src={resolveImageUrl(item.thumbnailUrl)} alt={item.name} className="h-24 w-24 rounded-xl object-cover" /><div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{item.name}</p><p className="mt-1 font-black text-indigo-700">{formatPrice(item.price)}</p><div className="mt-3 flex items-center justify-between"><div className="flex items-center rounded-lg border border-slate-200"><button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-2"><Minus size={15} /></button><span className="w-8 text-center text-sm font-bold">{item.quantity}</span><button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stockQuantity} className="p-2 disabled:opacity-40"><Plus size={15} /></button></div><button onClick={() => removeItem(item.productId)} className="text-rose-600"><Trash2 size={18} /></button></div></div></article>)}</div><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-black">Tóm tắt đơn hàng</h2><div className="mt-5 flex justify-between font-bold"><span>Tổng thanh toán</span><span className="text-xl text-indigo-700">{formatPrice(total)}</span></div><button onClick={checkout} className="mt-5 w-full rounded-xl bg-indigo-600 py-3 font-bold text-white">Tiến hành thanh toán</button><p className="mt-4 flex gap-2 text-xs text-slate-500"><ShieldCheck size={17} className="text-emerald-600" /> Cần đăng nhập để đặt hàng.</p></aside></div></section>;
}
