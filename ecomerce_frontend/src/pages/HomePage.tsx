import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";

const benefits = [
    ["Tìm kiếm nhanh", "Tra cứu sản phẩm theo tên chỉ trong vài giây."],
    ["Lọc chính xác", "Chọn danh mục và khoảng giá phù hợp."],
    ["Thông tin rõ ràng", "Xem giá, tồn kho và mô tả trước khi chọn mua."],
];

export default function HomePage() {
    return (
        <>
            <section className="bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-700 text-white">
                <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
                    <div>
                        <p className="mb-4 text-sm font-bold uppercase tracking-[.2em] text-indigo-200">Mua sắm thông minh mỗi ngày</p>
                        <h1 className="max-w-xl text-4xl font-black leading-tight sm:text-5xl">Tìm thấy điều bạn cần, với mức giá bạn yêu thích.</h1>
                        <p className="mt-5 max-w-lg leading-7 text-indigo-100">Khám phá các sản phẩm chất lượng, tìm kiếm nhanh và lọc chính xác theo nhu cầu của bạn.</p>
                        <Link to="/products" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-indigo-700 transition hover:bg-indigo-50">Khám phá sản phẩm <ArrowRight size={18} /></Link>
                    </div>
                    <div className="hidden place-items-center lg:grid"><div className="grid h-72 w-72 place-items-center rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur"><Search size={100} className="text-indigo-200" /></div></div>
                </div>
            </section>
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
                <h2 className="text-2xl font-black">Mua sắm theo cách của bạn</h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">{benefits.map(([title, text]) => <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div>
            </section>
        </>
    );
}
