"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { products as allProducts, type Product } from "@/mock/products";

type PriceKey = "all" | "under50" | "50to100" | "100to150" | "over150";
type SortKey = "newest" | "priceAsc" | "priceDesc" | "nameAsc";

export default function Page() {
    const [category, setCategory] = useState<string>("all");
    const [size, setSize] = useState<string>("all");
    const [color, setColor] = useState<string>("all");
    const [price, setPrice] = useState<PriceKey>("all");
    const [sort, setSort] = useState<SortKey>("newest");
    const [visible, setVisible] = useState<number>(8);

    const categories = useMemo(
        () => Array.from(new Set(allProducts.map((p) => p.category))),
        []
    );
    const sizes = useMemo(
        () =>
            Array.from(
                new Set(
                    allProducts.flatMap((p) => (p.sizes ? p.sizes : []))
                )
            ),
        []
    );
    const colors = useMemo(
        () =>
            Array.from(
                new Set(
                    allProducts.flatMap((p) => (p.colors ? p.colors : []))
                )
            ),
        []
    );

    const filtered = useMemo(() => {
        let list: Product[] = allProducts.slice();

        if (category !== "all") list = list.filter((p) => p.category === category);
        if (size !== "all") list = list.filter((p) => p.sizes?.includes(size));
        if (color !== "all") list = list.filter((p) => p.colors?.includes(color));

        if (price !== "all") {
            list = list.filter((p) => {
                if (price === "under50") return p.price < 50;
                if (price === "50to100") return p.price >= 50 && p.price <= 100;
                if (price === "100to150") return p.price > 100 && p.price <= 150;
                if (price === "over150") return p.price > 150;
                return true;
            });
        }

        if (sort === "priceAsc") list.sort((a, b) => a.price - b.price);
        else if (sort === "priceDesc") list.sort((a, b) => b.price - a.price);
        else if (sort === "nameAsc") list.sort((a, b) => a.name.localeCompare(b.name));
        // "newest" keeps source order (mock order acts as newest)

        return list;
    }, [category, size, color, price, sort]);

    const resetFilters = () => {
        setCategory("all");
        setSize("all");
        setColor("all");
        setPrice("all");
        setSort("newest");
        setVisible(8);
    };

    return (
        <main className="py-10 md:py-12">
            <div className="container-custom page-container">
                {/* Header */}
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6 md:mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                STREETWEAR
                            </span>
                            <span className="h-1 w-10 bg-emerald-500 rounded-full" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            STREETWEAR COLLECTION
                        </h1>
                        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                            Essential gear for the modern nomad. From core basics to limited drops.
                        </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {filtered.length} items
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center gap-3 md:gap-4 border-b pb-4 mb-6">
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger size="sm">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Category: All</SelectItem>
                            {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                    Category: {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={size} onValueChange={setSize}>
                        <SelectTrigger size="sm">
                            <SelectValue placeholder="Size" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Size: All</SelectItem>
                            {sizes.map((s) => (
                                <SelectItem key={s} value={s}>
                                    Size: {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={price} onValueChange={(v: PriceKey) => setPrice(v)}>
                        <SelectTrigger size="sm">
                            <SelectValue placeholder="Price" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Price: All</SelectItem>
                            <SelectItem value="under50">Under $50</SelectItem>
                            <SelectItem value="50to100">$50 — $100</SelectItem>
                            <SelectItem value="100to150">$100 — $150</SelectItem>
                            <SelectItem value="over150">Over $150</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={color} onValueChange={setColor}>
                        <SelectTrigger size="sm">
                            <SelectValue placeholder="Color" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Color: All</SelectItem>
                            {colors.map((c) => (
                                <SelectItem key={c} value={c}>
                                    Color: {c}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                        Reset All
                    </Button>

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

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {filtered.slice(0, visible).map((product) => (
                        <ProductCard key={product.id} product={product} />)
                    )}
                </div>

                {/* Load more */}
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
