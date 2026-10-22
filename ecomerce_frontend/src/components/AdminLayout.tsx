import {
    Bell,
    Boxes,
    ChevronDown,
    FolderTree,
    LayoutDashboard,
    LogOut,
    Menu,
    Package,
    ReceiptText,
    Search,
    Settings,
    Store,
    X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const navigation = [
    { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
    { to: "/admin/orders", label: "Đơn hàng", icon: ReceiptText },
    { to: "/admin/categories", label: "Danh mục", icon: FolderTree },
    { to: "/admin/products", label: "Sản phẩm", icon: Package },
    { to: "/admin/inventory", label: "Tồn kho", icon: Boxes },
];

export default function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        await logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-[#071a3a] text-slate-100">
            {sidebarOpen && (
                <button
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-30 bg-slate-950/70 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#081c40] transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
                    <NavLink to="/admin" className="flex items-center gap-3 text-xl font-extrabold tracking-tight">
                        <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-[#071a3a]"><Store size={20} /></span>
                        Quản trị Shop
                    </NavLink>
                    <button className="lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng thanh điều hướng"><X size={20} /></button>
                </div>

                <nav className="flex-1 space-y-1 px-4 py-6">
                    <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Điều hướng</p>
                    {navigation.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? "bg-cyan-400 text-[#071a3a] shadow-lg shadow-cyan-500/10" : "text-slate-300 hover:bg-white/8 hover:text-white"}`}
                        >
                            <Icon size={19} /> {label}
                        </NavLink>
                    ))}
                    <div className="my-5 border-t border-white/10" />
                    <NavLink to="/products" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/8 hover:text-white">
                        <Package size={19} /> Xem cửa hàng
                    </NavLink>
                    <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/8 hover:text-white">
                        <Settings size={19} /> Cài đặt
                    </button>
                </nav>

                <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-slate-400">Khu vực quản trị</p>
                    <p className="mt-1 text-sm font-bold">Quản lý cửa hàng hiệu quả</p>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-white/10 bg-[#071a3a]/95 px-4 backdrop-blur lg:px-8">
                    <button className="rounded-xl p-2 text-slate-300 hover:bg-white/10 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Mở thanh điều hướng"><Menu /></button>
                    <div className="hidden max-w-md flex-1 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 md:flex">
                        <Search size={18} className="text-slate-400" />
                        <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" placeholder="Tìm đơn hàng, sản phẩm..." />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <NavLink to="/" className="hidden rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 sm:block">Xem website</NavLink>
                        <button className="relative rounded-xl p-2.5 text-slate-300 transition hover:bg-white/10" aria-label="Thông báo"><Bell size={19} /><span className="absolute right-2 top-2 size-2 rounded-full bg-cyan-400" /></button>
                        <div className="relative">
                            <button className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white/10" onClick={() => setProfileOpen(!profileOpen)}>
                                {user?.avatarUrl ? <img src={user.avatarUrl} className="size-9 rounded-lg object-cover" /> : <span className="grid size-9 place-items-center rounded-lg bg-cyan-400 font-bold text-[#071a3a]">{(user?.fullName || "A").charAt(0).toUpperCase()}</span>}
                                <span className="hidden text-left sm:block"><span className="block text-sm font-bold leading-4">{user?.fullName || "Quản trị viên"}</span><span className="block text-xs text-cyan-300">Quản trị viên</span></span>
                                <ChevronDown size={15} className="hidden sm:block" />
                            </button>
                            {profileOpen && <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-[#102852] p-2 shadow-2xl">
                                <div className="border-b border-white/10 px-3 py-2"><p className="text-sm font-semibold">{user?.fullName || "Quản trị viên"}</p><p className="truncate text-xs text-slate-400">{user?.username}</p></div>
                                <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-400/10"><LogOut size={16} /> Đăng xuất</button>
                            </div>}
                        </div>
                    </div>
                </header>
                <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
            </div>
        </div>
    );
}
