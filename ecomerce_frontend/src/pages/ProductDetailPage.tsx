import { ArrowLeft, PackageCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { catalogService } from "../service/catalogService";
import type { Product } from "../types/catalog";

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

    useEffect(() => {
        catalogService.getProduct(id).then(setProduct).catch(() => {
            setError("Không thể tải chi tiết sản phẩm.");
        });
    }, [id]);

    if (error) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-16">
                <p className="text-rose-600">{error}</p>
                <Link to="/products" className="mt-4 inline-block text-indigo-600">
                    Quay lại sản phẩm
                </Link>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-16">
                <div className="h-96 animate-pulse rounded-2xl bg-slate-200" />
            </div>
        );
    }

    const imageUrl =
        product.images[0]?.url ||
        product.thumbnailUrl ||
        "https://placehold.co/800x800/f1f5f9/64748b?text=ShopNova";

    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <Link
                to="/products"
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
            >
                <ArrowLeft size={17} />
                Quay lại sản phẩm
            </Link>

            <div className="grid gap-10 lg:grid-cols-2">
                <div className="overflow-hidden rounded-2xl bg-white">
                    <img src={imageUrl} alt={product.name} className="aspect-square w-full object-cover" />
                </div>
                <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-indigo-600">
                        {product.category.name}
                    </p>
                    <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                        {product.name}
                    </h1>
                    <p className="mt-5 text-3xl font-black text-indigo-700">
                        {formatPrice(product.price)}
                    </p>
                    <div className="mt-5 flex items-center gap-2 text-sm">
                        <PackageCheck
                            size={18}
                            className={product.inStock ? "text-emerald-600" : "text-rose-600"}
                        />
                        <span className={product.inStock ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>
                            {product.inStock
                                ? `Còn hàng (${product.stockQuantity} sản phẩm)`
                                : "Tạm hết hàng"}
                        </span>
                    </div>
                    <div className="mt-8 border-t border-slate-200 pt-6">
                        <h2 className="font-bold">Mô tả sản phẩm</h2>
                        <p className="mt-3 whitespace-pre-line leading-7 text-slate-600">
                            {product.description || "Thông tin mô tả đang được cập nhật."}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
