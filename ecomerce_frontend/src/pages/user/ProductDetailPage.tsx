import {
    ArrowLeft,
    BadgeCheck,
    PackageCheck,
    ShieldCheck,
    ShoppingCart,
    Truck,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { catalogService } from "../../service/catalogService";
import { useCartStore } from "../../store/cartStore";
import type { Product } from "../../types/catalog";

import { resolveImageUrl } from "../../lib/image";

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(price);

export default function ProductDetailPage() {
    const { id = "" } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [error, setError] = useState("");
    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        catalogService.getProduct(id).then(setProduct).catch(() => {
            setError("Không thể tải chi tiết sản phẩm.");
        });
    }, [id]);

    if (error) {
        return <div className="mx-auto max-w-7xl px-4 py-16"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700"><p className="font-bold">{error}</p><Link to="/products" className="mt-3 inline-block font-bold underline">Quay lại danh sách sản phẩm</Link></div></div>;
    }

    if (!product) {
        return <div className="mx-auto max-w-7xl px-4 py-10"><div className="h-[520px] animate-pulse rounded-3xl bg-slate-200" /></div>;
    }

    const currentImage = selectedImage || product.images[0]?.url || product.thumbnailUrl;
    const imageUrl = resolveImageUrl(currentImage);

    const handleAddToCart = () => { addItem(product); toast.success(`Đã thêm ${product.name} vào giỏ hàng`); };
    return (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <Link to="/products" className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-indigo-600">
                <ArrowLeft size={17} /> Quay lại danh sách sản phẩm
            </Link>
            <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <img src={imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
                    </div>
                    {product.images && product.images.length > 1 && (
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {product.images.map((img) => {
                                const resolved = resolveImageUrl(img.url);
                                const isSelected = currentImage === img.url;
                                return (
                                    <button
                                        key={img.id || img.url}
                                        type="button"
                                        onClick={() => setSelectedImage(img.url)}
                                        className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${isSelected ? "border-indigo-600 ring-2 ring-indigo-600/20" : "border-slate-200 hover:border-slate-300"}`}
                                    >
                                        <img src={resolved} alt="" className="size-full object-cover" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
                <div className="py-2">
                    <p className="text-sm font-bold uppercase tracking-[.14em] text-indigo-600">{product.category.name}</p>
                    <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <p className="text-3xl font-black text-indigo-700">{formatPrice(product.price)}</p>
                        <span className={product.inStock ? "rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700" : "rounded-full bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700"}>
                            {product.inStock ? `Còn ${product.stockQuantity} sản phẩm` : "Tạm hết hàng"}
                        </span>
                    </div>
                    <button type="button" disabled={!product.inStock} onClick={handleAddToCart} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                        <ShoppingCart size={19} />{product.inStock ? "Thêm vào giỏ hàng" : "Sản phẩm tạm hết hàng"}
                    </button>
                    <Link to="/cart" className="mt-3 block text-center text-sm font-bold text-indigo-600 hover:underline">Xem giỏ hàng</Link>
                    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-3">
                            <span className={product.inStock ? "grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600" : "grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"}>
                                <PackageCheck size={21} />
                            </span>
                            <div>
                                <p className="font-bold">{product.inStock ? "Sẵn sàng giao hàng" : "Sản phẩm đang hết hàng"}</p>
                                <p className="mt-0.5 text-sm text-slate-500">{product.inStock ? "Tồn kho được đồng bộ theo thời gian thực." : "Vui lòng quay lại sau hoặc khám phá sản phẩm tương tự."}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-7 border-t border-slate-200 pt-6">
                        <h2 className="text-lg font-black">Thông tin sản phẩm</h2>
                        <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">{product.description || "Thông tin mô tả đang được cập nhật."}</p>
                    </div>
                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <Info icon={ShieldCheck} text="Sản phẩm rõ nguồn gốc" />
                        <Info icon={Truck} text="Giao hàng tận nơi" />
                        <Info icon={BadgeCheck} text="Hỗ trợ đổi trả" />
                    </div>
                </div>
            </div>
        </section>
    );
}

function Info({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
    return <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-3 text-xs font-bold text-slate-600"><Icon size={17} className="shrink-0 text-indigo-600" />{text}</div>;
}
