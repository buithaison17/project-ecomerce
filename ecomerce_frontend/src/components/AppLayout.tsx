import { Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function AppLayout() {
    const navigate = useNavigate(); const [keyword, setKeyword] = useState("");
    const user = useAuthStore((state) => state.user);
    const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
    useEffect(() => {
        loadCurrentUser().catch(() => undefined);
    }, [loadCurrentUser]);
    const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); navigate(keyword.trim() ? `/products?keyword=${encodeURIComponent(keyword.trim())}` : "/products"); };
    return <div className="min-h-screen bg-slate-50 text-slate-900"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6"><Link to="/" className="flex shrink-0 items-center gap-2 font-black tracking-tight text-slate-950"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white"><ShoppingBag size={19} /></span>Shop<span className="text-indigo-600">Nova</span></Link><form onSubmit={submitSearch} className="hidden max-w-xl flex-1 md:block"><label className="relative block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm kiếm sản phẩm..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100" /></label></form><nav className="ml-auto flex items-center gap-2 text-sm font-medium"><Link to="/products" className="hidden rounded-lg px-3 py-2 hover:bg-slate-100 sm:block">Sản phẩm</Link>{user ? <div className="flex items-center gap-2"><img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullName)}&background=4f46e5&color=fff`} alt="Ảnh đại diện" className="h-8 w-8 rounded-full" /><span className="hidden sm:inline">{user.fullName}</span></div> : <Link to="/login" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-slate-100"><UserRound size={18} /><span className="hidden sm:inline">Đăng nhập</span></Link>}<button type="button" className="rounded-lg p-2 hover:bg-slate-100 md:hidden" aria-label="Mở menu"><Menu size={20} /></button></nav></div></header><main><Outlet /></main><footer className="mt-16 border-t border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500 sm:px-6">© 2026 ShopNova. Mua sắm an tâm, giao hàng nhanh chóng.</div></footer></div>;
}
