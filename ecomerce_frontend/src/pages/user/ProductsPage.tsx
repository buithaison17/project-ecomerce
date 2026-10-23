import {
    ChevronDown,
    ChevronUp,
    RotateCcw,
    Search,
    SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";

import { EmptyProducts } from "../../components/ProductCard";
import ProductCard from "../../components/ProductCard";
import { catalogService } from "../../service/catalogService";
import type {
    Category,
    PageResponse,
    ProductSummary,
} from "../../types/catalog";

type SortBy = "createdAt" | "price" | "name";

interface FilterGroupDefinition {
    title: string;
    options: string[];
}

interface PriceRange {
    label: string;
    min: string;
    max: string;
}

const priceRanges: PriceRange[] = [
    { label: "Dưới 5 triệu", min: "0", max: "5000000" },
    { label: "Từ 5 - 10 triệu", min: "5000000", max: "10000000" },
    { label: "Từ 10 - 20 triệu", min: "10000000", max: "20000000" },
    { label: "Trên 20 triệu", min: "20000000", max: "" },
];

export default function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    const [categories, setCategories] = useState<Category[]>([]);
    const [result, setResult] = useState<PageResponse<ProductSummary> | null>(
        null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const keyword = searchParams.get("keyword") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const minPrice = searchParams.get("minPrice") || "";
    const maxPrice = searchParams.get("maxPrice") || "";

    const rawSortBy = searchParams.get("sortBy");
    const sortBy: SortBy =
        rawSortBy === "price" || rawSortBy === "name" ? rawSortBy : "createdAt";

    const page = Number(searchParams.get("page") || 0);

    const selectedCategory =
        categories.find((category) => String(category.id) === categoryId) ||
        null;

    useEffect(() => {
        catalogService
            .getCategories()
            .then(setCategories)
            .catch(() => {
                setError("Không thể tải danh mục.");
            });
    }, []);

    useEffect(() => {
        let cancelled = false;

        setLoading(true);

        catalogService
            .getProducts({
                keyword: keyword || undefined,
                categoryId: categoryId ? Number(categoryId) : undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                sortBy,
                sortDir: sortBy === "price" ? "asc" : "desc",
                page,
                size: 12,
            })
            .then((value) => {
                if (cancelled) return;

                setResult(value);
                setError("");
            })
            .catch(() => {
                if (!cancelled) {
                    setError(
                        "Không thể tải sản phẩm. Vui lòng kiểm tra Backend đang chạy.",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [keyword, categoryId, minPrice, maxPrice, sortBy, page]);

    const updateFilter = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);

        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }

        next.delete("page");
        setSearchParams(next);
    };

    const updatePriceRange = (min: string, max: string) => {
        const next = new URLSearchParams(searchParams);

        if (min) next.set("minPrice", min);
        else next.delete("minPrice");

        if (max) next.set("maxPrice", max);
        else next.delete("maxPrice");

        next.delete("page");
        setSearchParams(next);
    };

    const onInput =
        (key: string) =>
        (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            updateFilter(key, event.target.value);
        };

    const clearFilters = () => {
        setSearchParams({});
    };

    return (
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <CategoryHeader category={selectedCategory} />

            <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
                <FilterPanel
                    categories={categories}
                    categoryId={categoryId}
                    keyword={keyword}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onInput={onInput}
                    onPriceRange={updatePriceRange}
                    onClear={clearFilters}
                    selectedCategory={selectedCategory}
                />

                <div className="min-w-0">
                    <ProductToolbar
                        result={result}
                        sortBy={sortBy}
                        onChange={onInput("sortBy")}
                    />

                    <ProductResults
                        loading={loading}
                        error={error}
                        products={result?.content || []}
                    />

                    {result && result.totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button
                                type="button"
                                disabled={page <= 0 || loading}
                                onClick={() =>
                                    updateFilter("page", String(page - 1))
                                }
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
                            >
                                Trang trước
                            </button>

                            <span className="text-sm text-slate-600">
                                Trang {page + 1} / {result.totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    page >= result.totalPages - 1 || loading
                                }
                                onClick={() =>
                                    updateFilter("page", String(page + 1))
                                }
                                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold disabled:opacity-40"
                            >
                                Trang sau
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function CategoryHeader({ category }: { category: Category | null }) {
    if (category) {
        return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-indigo-600">
                        Danh mục sản phẩm
                    </p>
                    <h1 className="mt-1 text-2xl font-black text-slate-950">
                        {category.name}
                    </h1>
                </div>

                <p className="text-sm text-slate-600">
                    {category.description ||
                        "Khám phá các sản phẩm phù hợp với bạn."}
                </p>
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-700 to-violet-700 px-6 py-9 text-white sm:px-10">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-indigo-200">
                Khám phá catalogue
            </p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                Tìm sản phẩm phù hợp với bạn
            </h1>
            <p className="mt-3 max-w-2xl text-indigo-100">
                Tìm kiếm, chọn danh mục và lọc sản phẩm theo mức giá.
            </p>
        </div>
    );
}

interface FilterPanelProps {
    categories: Category[];
    categoryId: string;
    keyword: string;
    minPrice: string;
    maxPrice: string;
    onInput: (
        key: string,
    ) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onPriceRange: (min: string, max: string) => void;
    onClear: () => void;
    selectedCategory: Category | null;
}

function FilterPanel({
    categories,
    categoryId,
    keyword,
    minPrice,
    maxPrice,
    onInput,
    onPriceRange,
    onClear,
    selectedCategory,
}: FilterPanelProps) {
    return (
        <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <h2 className="flex items-center gap-2 text-sm font-black">
                    <SlidersHorizontal size={17} className="text-indigo-600" />
                    Bộ lọc
                </h2>

                <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                    <RotateCcw size={15} />
                    Xóa lọc
                </button>
            </div>

            <div className="space-y-4 border-b border-slate-100 p-4">
                <label className="block text-sm font-bold">
                    Tìm kiếm
                    <span className="relative mt-2 block">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            value={keyword}
                            onChange={onInput("keyword")}
                            placeholder="Tên sản phẩm"
                            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-indigo-400"
                        />
                    </span>
                </label>

                <label className="block text-sm font-bold">
                    Danh mục
                    <select
                        value={categoryId}
                        onChange={onInput("categoryId")}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400"
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <FilterGroup
                title="Mức giá"
                options={priceRanges.map((range) => range.label)}
                selected={priceRanges
                    .filter(
                        (range) =>
                            range.min === minPrice && range.max === maxPrice,
                    )
                    .map((range) => range.label)}
                onToggle={(label) => {
                    const range = priceRanges.find(
                        (item) => item.label === label,
                    );

                    if (range) {
                        onPriceRange(range.min, range.max);
                    }
                }}
            />

            <div className="border-b border-slate-100 px-4 py-3">
                <p className="mb-2 text-sm font-bold">Khoảng giá tùy chỉnh</p>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        value={minPrice}
                        onChange={onInput("minPrice")}
                        type="number"
                        min="0"
                        placeholder="Từ"
                        className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                    <input
                        value={maxPrice}
                        onChange={onInput("maxPrice")}
                        type="number"
                        min="0"
                        placeholder="Đến"
                        className="w-full rounded-xl border border-slate-200 px-2 py-2 text-sm outline-none focus:border-indigo-400"
                    />
                </div>
            </div>

            {selectedCategory && (
                <CategorySpecificFilters category={selectedCategory} />
            )}
        </aside>
    );
}

function ProductToolbar({
    result,
    sortBy,
    onChange,
}: {
    result: PageResponse<ProductSummary> | null;
    sortBy: SortBy;
    onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
                {result ? (
                    <>
                        <strong className="text-slate-900">
                            {result.totalElements}
                        </strong>{" "}
                        sản phẩm được tìm thấy
                    </>
                ) : (
                    "Đang tải sản phẩm..."
                )}
            </p>

            <select
                value={sortBy}
                onChange={onChange}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-indigo-400"
            >
                <option value="createdAt">Mới cập nhật</option>
                <option value="price">Giá tăng dần</option>
                <option value="name">Tên A-Z</option>
            </select>
        </div>
    );
}

function ProductResults({
    loading,
    error,
    products,
}: {
    loading: boolean;
    error: string;
    products: ProductSummary[];
}) {
    if (error) {
        return (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
                {error}
            </div>
        );
    }

    if (loading) {
        return (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }, (_, index) => (
                    <div
                        key={index}
                        className="h-80 animate-pulse rounded-2xl bg-slate-200"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {products.length ? (
                products.map((product) => (
                    <ProductCard product={product} key={product.id} />
                ))
            ) : (
                <div className="col-span-full">
                    <EmptyProducts />
                </div>
            )}
        </div>
    );
}

function CategorySpecificFilters({ category }: { category: Category }) {
    const groups = useMemo(
        () => getCategoryFilters(category.name),
        [category.name],
    );

    return (
        <>
            {groups.map((group) => (
                <FilterGroup
                    key={group.title}
                    title={group.title}
                    options={group.options}
                    selected={[]}
                    onToggle={() => {
                        // Chưa nối với API lọc thuộc tính.
                    }}
                />
            ))}
        </>
    );
}

function FilterGroup({
    title,
    options,
    selected,
    onToggle,
}: {
    title: string;
    options: string[];
    selected: string[];
    onToggle: (option: string) => void;
}) {
    const [open, setOpen] = useState(true);

    return (
        <div className="border-b border-slate-100 px-5 py-4">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="flex w-full items-center justify-between text-left text-sm font-black"
            >
                {title}
                {open ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>

            {open && (
                <div className="mt-3 space-y-2.5">
                    {options.map((option) => (
                        <label
                            className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                            key={option}
                        >
                            <input
                                type="checkbox"
                                checked={selected.includes(option)}
                                onChange={() => onToggle(option)}
                                className="h-4 w-4 rounded accent-indigo-600"
                            />
                            {option}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}

function getCategoryFilters(categoryName: string): FilterGroupDefinition[] {
    const name = categoryName.toLowerCase();

    if (name.includes("laptop") || name.includes("pc")) {
        return [
            {
                title: "Nhu cầu",
                options: [
                    "Văn phòng",
                    "Gaming",
                    "Đồ họa - kỹ thuật",
                    "Mỏng nhẹ",
                ],
            },
            {
                title: "CPU",
                options: [
                    "Intel Core i3",
                    "Intel Core i5",
                    "Intel Core i7",
                    "AMD Ryzen 5",
                    "AMD Ryzen 7",
                ],
            },
            {
                title: "Card đồ họa",
                options: ["NVIDIA GeForce", "AMD Radeon", "Card tích hợp"],
            },
        ];
    }

    if (name.includes("điện thoại") || name.includes("phone")) {
        return [
            {
                title: "Thương hiệu",
                options: ["Apple", "Samsung", "Xiaomi", "OPPO", "vivo"],
            },
            {
                title: "Dung lượng",
                options: ["64GB", "128GB", "256GB", "512GB"],
            },
            {
                title: "Tính năng",
                options: ["5G", "Sạc nhanh", "Camera tốt", "Pin lớn"],
            },
        ];
    }

    return [
        {
            title: "Thương hiệu",
            options: ["Apple", "Samsung", "Sony", "Baseus", "Anker"],
        },
        {
            title: "Nhu cầu sử dụng",
            options: ["Học tập", "Làm việc", "Giải trí", "Du lịch"],
        },
    ];
}
