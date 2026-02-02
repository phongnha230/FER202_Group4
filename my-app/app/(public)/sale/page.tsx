"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getProducts } from "@/lib/api/product.api";
import { adaptProductsToUI, UIProduct } from "@/lib/adapters/product.adapter";
import { Loader2 } from "lucide-react";

type PriceKey = "all" | "under50" | "50to100" | "100to150" | "over150";
type SortKey = "newest" | "priceAsc" | "priceDesc" | "nameAsc";

export default function Page() {
    const [baseProducts, setBaseProducts] = useState<UIProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [category, setCategory] = useState<string>("all");
    const [size, setSize] = useState<string>("all");
    const [color, setColor] = useState<string>("all");
    const [price, setPrice] = useState<PriceKey>("all");
    const [sort, setSort] = useState<SortKey>("newest");
    const [visible, setVisible] = useState<number>(8);

    useEffect(() => {
        async function loadProducts() {
            try {
                setLoading(true);
                // Fetch all products and filter for those with sale prices
                const { data, error } = await getProducts({ status: 'active' });
                
                if (error) throw error;
                
                // Filter for products with sale prices
                const adapted = adaptProductsToUI(data);
                const saleProducts = adapted.filter(p => p.salePrice);
                setBaseProducts(saleProducts);
            } catch (err) {
                console.error('Error loading sale products:', err);
                setError(err instanceof Error ? err.message : 'Failed to load products');
            } finally {
                setLoading(false);
            }
        }

        loadProducts();
    }, []);

    const categories = useMemo(
        () => Array.from(new Set(baseProducts.map((p) => p.category))),
        [baseProducts]
    );
    const sizes = useMemo(
        () => Array.from(new Set(baseProducts.flatMap((p) => p.sizes ?? []))),
        [baseProducts]
    );
    const colors = useMemo(
        () => Array.from(new Set(baseProducts.flatMap((p) => p.colors ?? []))),
        [baseProducts]
    );

    const filtered = useMemo(() => {
        let list: UIProduct[] = baseProducts.slice();
        if (category !== "all") list = list.filter((p) => p.category === category);
        if (size !== "all") list = list.filter((p) => p.sizes?.includes(size));
        if (color !== "all") list = list.filter((p) => p.colors?.includes(color));

        if (price !== "all") {
            list = list.filter((p) => {
                const compare = p.salePrice ?? p.price;
                if (price === "under50") return compare < 50;
                if (price === "50to100") return compare >= 50 && compare <= 100;
                if (price === "100to150") return compare > 100 && compare <= 150;
                if (price === "over150") return compare > 150;
                return true;
            });
        }

        if (sort === "priceAsc") list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        else if (sort === "priceDesc") list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        else if (sort === "nameAsc") list.sort((a, b) => a.name.localeCompare(b.name));
        return list;
    }, [baseProducts, category, size, color, price, sort]);

    const resetFilters = () => {
        setCategory("all");
        setSize("all");
        setColor("all");
        setPrice("all");
        setSort("newest");
        setVisible(8);
    };

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
                        <p>Error loading sale products: {error}</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="py-10 md:py-12">
            <div className="container-custom page-container">
                <div className="relative overflow-hidden rounded-xl mb-8 shadow-lg ring-1 ring-black/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-600 to-red-700" />
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_30%,white,transparent_35%),radial-gradient(circle_at_50%_80%,white,transparent_35%)]" />
                    <div className="relative px-6 py-10 md:px-12 md:py-14 text-white text-center">
                        <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ring-white/30">
                            Limited Time Only
                        </span>
                        <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight uppercase">
                            END OF SEASON SALE
                        </h1>
                        <p className="mt-2 text-base md:text-lg font-medium tracking-wide uppercase opacity-90">
                            UP TO 50% OFF
                        </p>
                      
                    </div>
                </div>

                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6 md:mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">SALE</span>
                            <span className="h-1 w-10 bg-red-500 rounded-full" />
                        </div>
                    </div>
                    <div className="ml-auto flex items-center gap-4 md:gap-6">
                        <div className="text-sm text-muted-foreground">{filtered.length} items</div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Sort by:</span>
                            <Select value={sort} onValueChange={(v: SortKey) => setSort(v)}>
                                <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="priceAsc">Price: Low to High</SelectItem>
                                    <SelectItem value="priceDesc">Price: High to Low</SelectItem>
                                    <SelectItem value="nameAsc">Name A–Z</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 md:gap-4 border-b pb-4 mb-6">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger size="sm"><SelectValue placeholder="Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Category: All</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c} value={c}>Category: {c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={size} onValueChange={setSize}>
                        <SelectTrigger size="sm"><SelectValue placeholder="Size" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Size: All</SelectItem>
                            {sizes.map((s) => (
                                <SelectItem key={s} value={s}>Size: {s}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={price} onValueChange={(v: PriceKey) => setPrice(v)}>
                        <SelectTrigger size="sm"><SelectValue placeholder="Price" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Price: All</SelectItem>
                            <SelectItem value="under50">Under $50</SelectItem>
                            <SelectItem value="50to100">$50 — $100</SelectItem>
                            <SelectItem value="100to150">$100 — $150</SelectItem>
                            <SelectItem value="over150">Over $150</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={color} onValueChange={setColor}>
                        <SelectTrigger size="sm"><SelectValue placeholder="Color" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Color: All</SelectItem>
                            {colors.map((c) => (
                                <SelectItem key={c} value={c}>Color: {c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="sm" onClick={resetFilters}>Reset All</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {filtered.slice(0, visible).map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                {visible < filtered.length && (
                    <div className="flex justify-center mt-10">
                        <Button className="btn-primary" onClick={() => setVisible((v) => v + 8)}>
                            Load More
                        </Button>
                    </div>
                )}
            </div>
        </main>
    );
}
