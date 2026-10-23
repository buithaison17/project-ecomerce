import { ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCartStore } from "../store/cartStore";

export default function CartButton() {
    const itemCount = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
    return <Link to="/cart" className="relative rounded-xl p-2.5 text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700" aria-label="Giỏ hàng"><ShoppingCart size={21} />{itemCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white">{itemCount > 99 ? "99+" : itemCount}</span>}</Link>;
}
