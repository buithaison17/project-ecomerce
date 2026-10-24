import { ArrowRight, BadgeCheck, PackageCheck, Search, ShieldCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";

const highlights = [
    { icon: Search, title: "Tìm nhanh", text: "Tra cứu sản phẩm theo tên chỉ trong vài giây." },
    { icon: ShieldCheck, title: "Mua sắm an tâm", text: "Thông tin giá, tồn kho và danh mục được cập nhật rõ ràng." },
    { icon: Truck, title: "Giao hàng tiện lợi", text: "Đặt hàng đơn giản và theo dõi hành trình mua sắm của bạn." },
];

export default function HomePage() {
    return (
        <>
            <section className="relative overflow-hidden bg-slate-950 text-white">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,.45),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,.3),_transparent_32%)]" />
                <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-28">
                    <div className="max-w-2xl">
                        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/30 bg-indigo-400/10 px-4 py-2 text-sm font-bold text-indigo-100"><BadgeCheck size={17} /> Lựa chọn thông minh cho mỗi ngày</span>
                        <h1 className="mt-6 text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl">Mua sắm theo cách <span className="text-indigo-300">đơn giản hơn.</span></h1>
                        <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Khám phá sản phẩm chất lượng, so sánh mức giá phù hợp và tìm đúng thứ bạn cần chỉ với vài thao tác.</p>
                        <div className="mt-9 flex flex-wrap gap-3"><Link to="/products" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:bg-indigo-50">Khám phá sản phẩm <ArrowRight size={18} /></Link><Link to="/products?sortBy=createdAt" className="rounded-xl border border-white/20 px-5 py-3.5 font-bold text-white transition hover:bg-white/10">Sản phẩm mới</Link></div>
                        <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-300"><span className="inline-flex items-center gap-2"><PackageCheck size={17} className="text-emerald-300" /> Thông tin tồn kho rõ ràng</span><span className="inline-flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-300" /> Mua sắm an toàn</span></div>
                    </div>
                    <div className="relative mx-auto hidden w-full max-w-md lg:block"><div className="absolute -inset-5 rounded-[2rem] bg-indigo-400/20 blur-3xl" /><div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur"><div className="rounded-2xl bg-white p-5 text-slate-900"><div className="flex items-center justify-between"><span className="font-black">Tìm đúng sản phẩm</span><Search className="text-indigo-600" /></div><div className="mt-5 rounded-xl bg-slate-100 p-3 text-sm text-slate-400">Bạn đang tìm gì hôm nay?</div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-indigo-50 p-4"><p className="text-xs font-bold text-indigo-500">DANH MỤC</p><p className="mt-1 font-bold">Đa dạng</p></div><div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs font-bold text-emerald-600">TỒN KHO</p><p className="mt-1 font-bold">Minh bạch</p></div></div></div></div></div>
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6"><div className="max-w-xl"><p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-600">Trải nghiệm mua sắm</p><h2 className="mt-3 text-3xl font-black tracking-tight">Mọi thông tin bạn cần, ở đúng nơi.</h2></div><div className="mt-9 grid gap-5 md:grid-cols-3">{highlights.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"><span className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon size={21} /></span><h3 className="mt-5 text-lg font-black">{title}</h3><p className="mt-2 leading-7 text-slate-600">{text}</p></article>)}</div></section>
        </>
    );
}
