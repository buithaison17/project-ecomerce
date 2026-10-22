import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { EmptyProducts } from "../components/ProductCard";
import ProductCard from "../components/ProductCard";
import { catalogService } from "../service/catalogService";
import type { Category, PageResponse, ProductSummary } from "../types/catalog";

type SortBy = "createdAt" | "price" | "name";

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [categories, setCategories] = useState<Category[]>([]);
    const [result, setResult] = useState<PageResponse<ProductSummary> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const keyword = searchParams.get("keyword") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";
    const sortBy = (searchParams.get("sortBy") || "createdAt") as SortBy;

    useEffect(() => {
        catalogService.getCategories().then(setCategories).catch(() => {
            setError("Không thể tải danh mục.");
        });
    }, []);

    useEffect(() => {
        catalogService
            .getProducts({
                keyword: keyword || undefined,
                categoryId: categoryId ? Number(categoryId) : undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                sortBy,
                sortDir: sortBy === "price" ? "asc" : "desc",
                page: Number(searchParams.get("page") || 0),
                size: 12,
            })
            .then((value) => {
                setResult(value);
                setError("");
            })
            .catch(() => setError("Không thể tải sản phẩm. Vui lòng kiểm tra Backend đang chạy."))
            .finally(() => setLoading(false));
    }, [searchParams, keyword, categoryId, minPrice, maxPrice, sortBy]);

    const updateFilter = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set(key, value);
        else next.delete(key);
        next.delete("page");
        setLoading(true);
        setSearchParams(next);
    };

    const onInput = (key: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        updateFilter(key, event.target.value);
    };

    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="mb-8">
                <p className="text-sm font-semibold text-indigo-600">CATALOGUE</p>
                <h1 className="mt-1 text-3xl font-black">Tất cả sản phẩm</h1>
                <p className="mt-2 text-slate-600">Tìm kiếm và lọc sản phẩm phù hợp với nhu cầu của bạn.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
                <FilterPanel categories={categories} values={{ keyword, categoryId, minPrice, maxPrice }} onInput={onInput} />
                <div>
                    <div className="mb-5 flex items-center justify-between">
                        <p className="text-sm text-slate-600">{result ? `${result.totalElements} sản phẩm` : "Đang tải..."}</p>
                        <select value={sortBy} onChange={onInput("sortBy")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500">
                            <option value="createdAt">Mới nhất</option>
                            <option value="price">Giá tăng dần</option>
                            <option value="name">Tên A-Z</option>
                        </select>
                    </div>
                    {error ? <ErrorMessage text={error} /> : <ProductGrid loading={loading} products={result?.content || []} />}
                </div>
            </div>
        </section>
    );
}

interface FilterPanelProps {
    categories: Category[];
    values: Record<"keyword" | "categoryId" | "minPrice" | "maxPrice", string>;
    onInput: (key: string) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

function FilterPanel({ categories, values, onInput }: FilterPanelProps) {
    return <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-bold"><SlidersHorizontal size={18} /> Bộ lọc</h2><div className="mt-5 space-y-4"><label className="block text-sm font-medium">Từ khóa<input value={values.keyword} onChange={onInput("keyword")} placeholder="Tên sản phẩm" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" /></label><label className="block text-sm font-medium">Danh mục<select value={values.categoryId} onChange={onInput("categoryId")} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-indigo-500"><option value="">Tất cả danh mục</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label><div className="grid grid-cols-2 gap-2"><label className="block text-sm font-medium">Giá từ<input value={values.minPrice} onChange={onInput("minPrice")} type="number" min="0" placeholder="0" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" /></label><label className="block text-sm font-medium">Đến<input value={values.maxPrice} onChange={onInput("maxPrice")} type="number" min="0" placeholder="Không giới hạn" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500" /></label></div></div></aside>;
}

function ProductGrid({ loading, products }: { loading: boolean; products: ProductSummary[] }) {
    if (loading) return <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-72 animate-pulse rounded-2xl bg-slate-200" />)}</div>;
    return <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{products.length ? products.map((product) => <ProductCard product={product} key={product.id} />) : <EmptyProducts />}</div>;
}

function ErrorMessage({ text }: { text: string }) {
    return <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{text}</div>;
}
