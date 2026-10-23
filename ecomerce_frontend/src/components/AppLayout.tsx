import {
    ChevronDown,
    ChevronRight,
    CircleUserRound,
    LogOut,
    Menu,
    Search,
    ShoppingBag,
    Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { catalogService } from "../service/catalogService";
import type { Category } from "../types/catalog";
import CartButton from "./CartButton";

export default function AppLayout() {
    const navigate = useNavigate();
    const [keyword, setKeyword] = useState("");
    const [profileOpen, setProfileOpen] = useState(false);
    const [catalogOpen, setCatalogOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<Category | null>(null);
    const user = useAuthStore((state) => state.user);
    const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);
    const logout = useAuthStore((state) => state.logout);

    useEffect(() => {
        loadCurrentUser().catch(() => undefined);
    }, [loadCurrentUser]);

    useEffect(() => {
        catalogService.getCategories().then((data) => {
            setCategories(data);
            setActiveCategory(data[0] || null);
        }).catch(() => undefined);
    }, []);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const search = keyword.trim();
        navigate(search ? `/products?keyword=${encodeURIComponent(search)}` : "/products");
    };

    const handleLogout = async () => {
        await logout();
        setProfileOpen(false);
        navigate("/");
    };

    const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "ShopNova")}&background=4f46e5&color=fff&bold=true`;

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <div className="hidden bg-slate-950 py-2 text-center text-xs font-medium text-slate-200 sm:block">
                Miễn phí giao hàng cho đơn từ 500.000đ <Sparkles className="mx-1 inline h-3.5 w-3.5 text-amber-300" />
                Ưu đãi mới mỗi tuần
            </div>
            <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
                <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6">
                    <Link to="/" className="flex shrink-0 items-center gap-2.5 text-lg font-black tracking-tight text-slate-950">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-200">
                            <ShoppingBag size={20} />
                        </span>
                        Shop<span className="text-indigo-600">Nova</span>
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex">
                        <div className="relative" onMouseLeave={() => setCatalogOpen(false)}>
                            <button type="button" onMouseEnter={() => setCatalogOpen(true)} onClick={() => setCatalogOpen((open) => !open)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700" aria-expanded={catalogOpen}>
                                Danh mục <ChevronDown size={15} />
                            </button>
                            {catalogOpen && <CategoryMegaMenu categories={categories} activeCategory={activeCategory} onSelect={(category) => setActiveCategory(category)} onNavigate={() => setCatalogOpen(false)} />}
                        </div>
                        <Link to="/products" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-700">Sản phẩm</Link>
                    </nav>

                    <form onSubmit={submitSearch} className="hidden max-w-md flex-1 lg:block">
                        <label className="relative block">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm sản phẩm bạn yêu thích..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50" />
                        </label>
                    </form>

                    <div className="ml-auto flex items-center gap-2">
                        <CartButton />
                        {user ? (
                            <div className="relative">
                                <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-slate-100" aria-expanded={profileOpen} aria-label="Mở menu tài khoản">
                                    <img src={avatarUrl} alt="Ảnh đại diện" className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm" />
                                    <span className="hidden max-w-32 truncate text-sm font-bold sm:block">{user.fullName}</span>
                                    <ChevronDown size={16} className="hidden text-slate-500 sm:block" />
                                </button>
                                {profileOpen && <ProfileMenu avatarUrl={avatarUrl} fullName={user.fullName} username={user.username} role={user.role} onLogout={handleLogout} />}
                            </div>
                        ) : (
                            <Link to="/login" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">
                                <CircleUserRound size={18} />
                                <span className="hidden sm:inline">Đăng nhập</span>
                            </Link>
                        )}
                        <button type="button" className="rounded-xl p-2.5 text-slate-700 hover:bg-slate-100 md:hidden" aria-label="Mở menu"><Menu size={21} /></button>
                    </div>
                </div>
            </header>
            <main><Outlet /></main>
            <footer className="mt-16 border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p>© 2026 ShopNova. Mua sắm an tâm, giao hàng tận nơi.</p><p>Hỗ trợ khách hàng 24/7</p></div></footer>
        </div>
    );
}

function ProfileMenu({ avatarUrl, fullName, username, role, onLogout }: { avatarUrl: string; fullName: string; username: string; role: string; onLogout: () => void }) {
    return <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50"><div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-5 text-white"><div className="flex items-center gap-3"><img src={avatarUrl} alt="Ảnh đại diện" className="h-12 w-12 rounded-full border-2 border-white/70 object-cover" /><div className="min-w-0"><p className="truncate font-bold">{fullName}</p><p className="truncate text-sm text-indigo-100">@{username}</p></div></div></div><div className="p-4"><div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vai trò</p><p className="mt-1 text-sm font-bold text-slate-700">{role === "ADMIN" ? "Quản trị viên" : "Khách hàng"}</p></div><button type="button" onClick={onLogout} className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"><LogOut size={17} /> Đăng xuất</button></div></div>;
}

function CategoryMegaMenu({
    categories,
    activeCategory,
    onSelect,
    onNavigate,
}: {
    categories: Category[];
    activeCategory: Category | null;
    onSelect: (category: Category) => void;
    onNavigate: () => void;
}) {
    if (!categories.length) {
        return <div className="absolute left-0 top-full w-72 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-2xl">Đang tải danh mục...</div>;
    }

    return (
        <div className="absolute left-0 top-full z-50 flex w-[660px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/50">
            <div className="w-56 shrink-0 border-r border-slate-100 bg-slate-50 p-2">
                <p className="px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-400">Danh mục</p>
                {categories.map((category) => (
                    <Link key={category.id} to={`/products?categoryId=${category.id}`} onMouseEnter={() => onSelect(category)} onClick={onNavigate} className={activeCategory?.id === category.id ? "flex w-full items-center justify-between rounded-xl bg-indigo-600 px-3 py-3 text-left text-sm font-bold text-white" : "flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-white hover:text-indigo-700"}>
                        <span className="truncate">{category.name}</span>
                        <ChevronRight size={16} />
                    </Link>
                ))}
            </div>
            <div className="flex min-h-72 flex-1 flex-col p-6">
                <p className="text-xs font-black uppercase tracking-[.16em] text-indigo-600">Khám phá danh mục</p>
                <h3 className="mt-2 text-2xl font-black text-slate-950">{activeCategory?.name}</h3>
                <p className="mt-3 max-w-sm leading-6 text-slate-600">{activeCategory?.description || "Khám phá những sản phẩm phù hợp với nhu cầu mua sắm của bạn."}</p>
                <div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-indigo-50 p-3 text-sm font-bold text-indigo-700">Sản phẩm đa dạng</div><div className="rounded-xl bg-violet-50 p-3 text-sm font-bold text-violet-700">Giá cập nhật</div></div>
                {activeCategory && <Link to={`/products?categoryId=${activeCategory.id}`} onClick={onNavigate} className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700">Xem sản phẩm <ChevronRight size={16} /></Link>}
            </div>
        </div>
    );
}
