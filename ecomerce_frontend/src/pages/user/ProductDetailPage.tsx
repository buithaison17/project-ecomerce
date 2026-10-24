import {
    ArrowLeft,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Maximize2,
    PackageCheck,
    ShieldCheck,
    ShoppingCart,
    Truck,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { formatProductImageUrl } from "../../lib/image";
import { catalogService } from "../../service/catalogService";
import { useCartStore } from "../../store/cartStore";
import type { Product } from "../../types/catalog";

const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(price);

export default function ProductDetailPage() {
    const { id = "" } = useParams();
    const [product, setProduct] = useState<Product | null>(null);
    const [error, setError] = useState("");
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        let cancelled = false;

        setProduct(null);
        setError("");
        setActiveImageIndex(0);
        setIsLightboxOpen(false);

        catalogService
            .getProduct(id)
            .then((data) => {
                if (!cancelled) {
                    setProduct(data);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError("Không thể tải chi tiết sản phẩm.");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    // Trích xuất toàn bộ ảnh sản phẩm từ Backend (bao gồm product.images và thumbnailUrl)
    const productImages = useMemo(() => {
        if (!product) return [];
        const list: string[] = [];

        // 1. Thêm tất cả ảnh trong danh sách product.images của BE
        if (product.images && Array.isArray(product.images)) {
            product.images.forEach((img) => {
                if (img?.url && typeof img.url === "string" && img.url.trim()) {
                    const formatted = formatProductImageUrl(img.url);
                    if (!list.includes(formatted)) {
                        list.push(formatted);
                    }
                }
            });
        }

        // 2. Thêm thumbnailUrl nếu chưa có
        if (
            product.thumbnailUrl &&
            typeof product.thumbnailUrl === "string" &&
            product.thumbnailUrl.trim()
        ) {
            const formattedThumb = formatProductImageUrl(product.thumbnailUrl);
            if (!list.includes(formattedThumb)) {
                list.unshift(formattedThumb);
            }
        }

        // 3. Fallback nếu chưa có ảnh nào
        if (list.length === 0) {
            list.push("https://placehold.co/900x900/f1f5f9/64748b?text=ShopNova");
        }

        return list;
    }, [product]);

    const prevImage = () => {
        setActiveImageIndex((prev) =>
            prev > 0 ? prev - 1 : productImages.length - 1
        );
    };

    const nextImage = () => {
        setActiveImageIndex((prev) =>
            prev < productImages.length - 1 ? prev + 1 : 0
        );
    };

    // Phím tắt điều hướng khi mở chế độ xem toàn màn hình (Lightbox)
    useEffect(() => {
        if (!isLightboxOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsLightboxOpen(false);
            if (e.key === "ArrowLeft") prevImage();
            if (e.key === "ArrowRight") nextImage();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isLightboxOpen, productImages.length]);

    if (error) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-16">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
                    <p className="font-bold">{error}</p>
                    <Link
                        to="/products"
                        className="mt-3 inline-block font-bold underline"
                    >
                        Quay lại danh sách sản phẩm
                    </Link>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-10">
                <div className="h-[520px] animate-pulse rounded-3xl bg-slate-200" />
            </div>
        );
    }

    const currentImageUrl = productImages[activeImageIndex] || productImages[0];

    const handleAddToCart = () => {
        addItem(product);
        toast.success(`Đã thêm ${product.name} vào giỏ hàng`);
    };

    return (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <Link
                to="/products"
                className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-indigo-600"
            >
                <ArrowLeft size={17} />
                Quay lại danh sách sản phẩm
            </Link>

            <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
                {/* Khu vực thư viện ảnh sản phẩm */}
                <div className="space-y-4">
                    {/* Khung ảnh chính */}
                    <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
                        <img
                            src={currentImageUrl}
                            alt={`${product.name} - Ảnh ${activeImageIndex + 1}`}
                            className="size-full cursor-zoom-in object-cover transition duration-300 group-hover:scale-102"
                            onClick={() => setIsLightboxOpen(true)}
                            onError={(e) => {
                                const target = e.currentTarget;
                                if (!target.src.includes("placehold.co")) {
                                    target.src =
                                        "https://placehold.co/900x900/f1f5f9/64748b?text=ShopNova";
                                }
                            }}
                        />

                        {/* Huy hiệu số lượng ảnh */}
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900/75 px-3 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                            Ảnh {activeImageIndex + 1} / {productImages.length}
                        </span>

                        {/* Nút phóng to toàn màn hình */}
                        <button
                            type="button"
                            onClick={() => setIsLightboxOpen(true)}
                            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md backdrop-blur-md transition hover:bg-white hover:text-indigo-600"
                            title="Xem toàn bộ ảnh kích thước lớn"
                        >
                            <Maximize2 size={13} /> Phóng to
                        </button>

                        {/* Nút lùi/tiến ảnh nếu có nhiều hơn 1 ảnh */}
                        {productImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prevImage();
                                    }}
                                    aria-label="Xem ảnh trước"
                                    className="absolute left-3 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-105 active:scale-95"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        nextImage();
                                    }}
                                    aria-label="Xem ảnh kế tiếp"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-white/90 text-slate-800 shadow-lg backdrop-blur-sm transition hover:bg-white hover:scale-105 active:scale-95"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Danh sách ảnh thu nhỏ (thumbnails) để xem toàn bộ ảnh từ BE */}
                    {productImages.length > 1 && (
                        <div>
                            <div className="mb-2 flex items-center justify-between px-1">
                                <span className="text-xs font-bold text-slate-700">
                                    Tất cả ảnh của sản phẩm ({productImages.length}):
                                </span>
                                <span className="text-[11px] text-slate-400">
                                    Nhấp vào ảnh để chuyển góc nhìn
                                </span>
                            </div>
                            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
                                {productImages.map((imgUrl, idx) => {
                                    const isActive = idx === activeImageIndex;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setActiveImageIndex(idx)}
                                            className={`group relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                                                isActive
                                                    ? "border-indigo-600 ring-4 ring-indigo-500/20 shadow-md"
                                                    : "border-slate-200 bg-white opacity-70 hover:opacity-100 hover:border-slate-300"
                                            }`}
                                        >
                                            <img
                                                src={imgUrl}
                                                alt={`${product.name} thu nhỏ ${idx + 1}`}
                                                className="size-full object-cover transition duration-200 group-hover:scale-105"
                                                onError={(e) => {
                                                    const target = e.currentTarget;
                                                    if (!target.src.includes("placehold.co")) {
                                                        target.src =
                                                            "https://placehold.co/160x160/f1f5f9/64748b?text=ShopNova";
                                                    }
                                                }}
                                            />
                                            {isActive && (
                                                <div className="absolute inset-0 bg-indigo-600/10" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Thông tin chi tiết sản phẩm */}
                <div className="py-2">
                    <p className="text-sm font-bold uppercase tracking-[.14em] text-indigo-600">
                        {product.category.name}
                    </p>

                    <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
                        {product.name}
                    </h1>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <p className="text-3xl font-black text-indigo-700">
                            {formatPrice(product.price)}
                        </p>

                        <span
                            className={
                                product.inStock
                                    ? "rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700"
                                    : "rounded-full bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700"
                            }
                        >
                            {product.inStock
                                ? `Còn ${product.stockQuantity} sản phẩm`
                                : "Tạm hết hàng"}
                        </span>
                    </div>

                    <button
                        type="button"
                        disabled={!product.inStock}
                        onClick={handleAddToCart}
                        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                        <ShoppingCart size={19} />
                        {product.inStock
                            ? "Thêm vào giỏ hàng"
                            : "Sản phẩm tạm hết hàng"}
                    </button>

                    <Link
                        to="/cart"
                        className="mt-3 block text-center text-sm font-bold text-indigo-600 hover:underline"
                    >
                        Xem giỏ hàng
                    </Link>

                    <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="flex items-center gap-3">
                            <span
                                className={
                                    product.inStock
                                        ? "grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"
                                        : "grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"
                                }
                            >
                                <PackageCheck size={21} />
                            </span>

                            <div>
                                <p className="font-bold">
                                    {product.inStock
                                        ? "Sẵn sàng giao hàng"
                                        : "Sản phẩm đang hết hàng"}
                                </p>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    {product.inStock
                                        ? "Tồn kho được đồng bộ theo thời gian thực."
                                        : "Vui lòng quay lại sau hoặc khám phá sản phẩm tương tự."}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-7 border-t border-slate-200 pt-6">
                        <h2 className="text-lg font-black">
                            Thông tin sản phẩm
                        </h2>
                        <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                            {product.description ||
                                "Thông tin mô tả đang được cập nhật."}
                        </p>
                    </div>

                    <div className="mt-7 grid gap-3 sm:grid-cols-3">
                        <Info icon={ShieldCheck} text="Sản phẩm rõ nguồn gốc" />
                        <Info icon={Truck} text="Giao hàng tận nơi" />
                        <Info icon={BadgeCheck} text="Hỗ trợ đổi trả" />
                    </div>
                </div>
            </div>

            {/* Modal Lightbox xem toàn bộ ảnh ở kích thước lớn */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex flex-col justify-between bg-slate-950/95 p-4 backdrop-blur-md animate-in fade-in sm:p-6"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    {/* Thanh tiêu đề modal */}
                    <div
                        className="flex items-center justify-between text-white"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div>
                            <h3 className="text-base font-bold sm:text-lg">
                                {product.name}
                            </h3>
                            <p className="text-xs text-slate-400">
                                Ảnh {activeImageIndex + 1} / {productImages.length}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsLightboxOpen(false)}
                            className="grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                            aria-label="Đóng"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Vùng hiển thị ảnh phóng to */}
                    <div
                        className="relative flex flex-1 items-center justify-center p-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={currentImageUrl}
                            alt={`${product.name} phóng to`}
                            className="max-h-[72vh] max-w-[90vw] select-none rounded-2xl object-contain shadow-2xl transition duration-200"
                        />

                        {productImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={prevImage}
                                    className="absolute left-2 grid size-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 active:scale-95 sm:left-6"
                                    aria-label="Ảnh trước"
                                >
                                    <ChevronLeft size={26} />
                                </button>
                                <button
                                    type="button"
                                    onClick={nextImage}
                                    className="absolute right-2 grid size-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 active:scale-95 sm:right-6"
                                    aria-label="Ảnh sau"
                                >
                                    <ChevronRight size={26} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Dải ảnh nhỏ bên dưới Lightbox */}
                    {productImages.length > 1 && (
                        <div
                            className="flex justify-center overflow-x-auto pb-2 scrollbar-thin"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex gap-2">
                                {productImages.map((imgUrl, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`size-14 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                                            idx === activeImageIndex
                                                ? "border-cyan-400 ring-2 ring-cyan-400/50 scale-105"
                                                : "border-white/20 opacity-50 hover:opacity-90"
                                        }`}
                                    >
                                        <img
                                            src={imgUrl}
                                            alt=""
                                            className="size-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}

function Info({
    icon: Icon,
    text,
}: {
    icon: typeof ShieldCheck;
    text: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-3 text-xs font-bold text-slate-600">
            <Icon size={17} className="shrink-0 text-indigo-600" />
            {text}
        </div>
    );
}
