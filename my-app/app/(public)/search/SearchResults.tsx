"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { searchProducts, getCategories, getProductsByCategory } from "@/services/product.service";
import { adaptProductsToUI, UIProduct } from "@/lib/adapters/product.adapter";
import { Loader2, SearchX } from "lucide-react";

type SortKey = "newest" | "priceAsc" | "priceDesc" | "nameAsc";

export default function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") ?? "";

    const [baseProducts, setBaseProducts] = useState<UIProduct[]>([]);
    const [matchedCategories, setMatchedCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sort, setSort] = useState<SortKey>("newest");
    const [visible, setVisible] = useState<number>(12);

    useEffect(() => {
        if (!query.trim()) {
            setBaseProducts([]);
            setMatchedCategories([]);
            return;
        }

        async function load() {
            try {
                setLoading(true);
                setError(null);
                setVisible(12);

                const [productResult, categoryResult] = await Promise.all([
                    searchProducts(query, 50),
                    getCategories(),
                ]);

                if (productResult.error) throw productResult.error;

                const productMap = new Map<string, UIProduct>();
                adaptProductsToUI(productResult.data).forEach((p) => productMap.set(p.id, p));

                const q = query.toLowerCase();
                const catMatches = (categoryResult.data ?? []).filter((c) =>
                    c.name.toLowerCase().includes(q)
                );
                setMatchedCategories(catMatches.map((c) => c.name));

                if (catMatches.length > 0) {
                    const catProductResults = await Promise.all(
                        catMatches.map((c) => getProductsByCategory(c.id))
                    );
                    catProductResults.forEach(({ data }) => {
                        adaptProductsToUI(data ?? []).forEach((p) => productMap.set(p.id, p));
                    });
                }

                setBaseProducts(Array.from(productMap.values()));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load results");
            } finally {
                setLoading(false);
            }
        }

        load();
    }, [query]);

    const sorted = useMemo(() => {
        const list = baseProducts.slice();
        if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
        else if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
        else if (sort === "nameAsc") list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [baseProducts, sort]);

    if (loading) {
        return (
            <main className="py-10 md:py-12">
                <div className="container-custom page-container">
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                    </div>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="py-10 md:py-12">
                <div className="container-custom page-container">
                    <div className="text-center text-red-600 py-8">
                        <p>Error: {error}</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="py-10 md:py-12">
            <div className="container-custom page-container">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Search results for</p>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            &ldquo;{query}&rdquo;
                        </h1>
                    </div>
                    {query && (
                        <div className="text-sm text-muted-foreground">{sorted.length} results</div>
                    )}
                </div>

                {/* Matched category chips */}
                {matchedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        <span className="text-xs text-muted-foreground self-center">Also found in:</span>
                        {matchedCategories.map((cat) => (
                            <span
                                key={cat}
                                className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                            >
                                {cat}
                            </span>
                        ))}
                    </div>
                )}

                {/* Sort bar */}
                {sorted.length > 0 && (
                    <div className="flex items-center gap-3 border-b pb-4 mb-6">
                        <div className="ml-auto flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Sort by:</span>
                            <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
                                <SelectTrigger size="sm">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                                    <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                                    <SelectItem value="nameAsc">Name A–Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {query && sorted.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-muted-foreground">
                        <SearchX className="w-12 h-12" />
                        <p className="text-lg font-medium">No products found for &ldquo;{query}&rdquo;</p>
                        <p className="text-sm">Try a different search term.</p>
                    </div>
                )}

                {/* No query state */}
                {!query && (
                    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-muted-foreground">
                        <p className="text-lg font-medium">Enter a search term to find products.</p>
                    </div>
                )}

                {/* Grid */}
                {sorted.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                            {sorted.slice(0, visible).map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {visible < sorted.length && (
                            <div className="flex justify-center mt-10">
                                <Button className="btn-primary" onClick={() => setVisible((v) => v + 12)}>
                                    Load More
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
