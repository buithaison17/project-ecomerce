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
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {sidebarOpen && (
                <button
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-blue-950/20 bg-[#0d274c] text-white shadow-xl transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
                    <NavLink to="/admin" className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-white">
                        <span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-[#0d274c] shadow-md shadow-cyan-500/20"><Store size={20} /></span>
                        Quản trị Shop
                    </NavLink>
                    <button className="text-blue-200 hover:text-white lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Đóng thanh điều hướng"><X size={20} /></button>
                </div>

                <nav className="flex-1 space-y-1.5 px-4 py-6">
                    <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300/70">Điều hướng</p>
                    {navigation.map(({ to, label, icon: Icon, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${isActive ? "bg-cyan-400 text-[#0d274c] shadow-lg shadow-cyan-500/25 font-bold" : "text-blue-100/80 hover:bg-white/10 hover:text-white"}`}
                        >
                            <Icon size={19} /> {label}
                        </NavLink>
                    ))}
                    <div className="my-5 border-t border-white/10" />
                    <NavLink to="/products" className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-blue-100/80 transition hover:bg-white/10 hover:text-white">
                        <Package size={19} /> Xem cửa hàng
                    </NavLink>
                    <button className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-blue-100/80 transition hover:bg-white/10 hover:text-white">
                        <Settings size={19} /> Cài đặt
                    </button>
                </nav>

                <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
                    <p className="text-xs text-blue-200/70">Khu vực quản trị</p>
                    <p className="mt-1 text-sm font-bold text-white">Quản lý cửa hàng hiệu quả</p>
                </div>
            </aside>

            <div className="lg:pl-72">
                <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur lg:px-8">
                    <button className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Mở thanh điều hướng"><Menu size={20} /></button>
                    <div className="hidden max-w-md flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 md:flex">
                        <Search size={18} className="text-slate-400" />
                        <input className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400" placeholder="Tìm đơn hàng, sản phẩm..." />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <NavLink to="/" className="hidden rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:block">Xem website</NavLink>
                        <button className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100" aria-label="Thông báo"><Bell size={19} /><span className="absolute right-2 top-2 size-2 rounded-full bg-cyan-500" /></button>
                        <div className="relative">
                            <button className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-100" onClick={() => setProfileOpen(!profileOpen)}>
                                {user?.avatarUrl ? <img src={user.avatarUrl} className="size-9 rounded-lg object-cover" /> : <span className="grid size-9 place-items-center rounded-lg bg-cyan-500 font-bold text-white">{(user?.fullName || "A").charAt(0).toUpperCase()}</span>}
                                <span className="hidden text-left sm:block"><span className="block text-sm font-bold leading-4 text-slate-800">{user?.fullName || "Quản trị viên"}</span><span className="block text-xs font-semibold text-blue-600">Quản trị viên</span></span>
                                <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
                            </button>
                            {profileOpen && <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                                <div className="border-b border-slate-100 px-3 py-2.5"><p className="text-sm font-bold text-slate-800">{user?.fullName || "Quản trị viên"}</p><p className="truncate text-xs text-slate-500">{user?.username}</p></div>
                                <button onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"><LogOut size={16} /> Đăng xuất</button>
                            </div>}
                        </div>
                    </div>
                </header>
                <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
            </div>
        </div>
    );
}
