"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchProducts, getCategories } from "@/services/product.service";
import { adaptProductsToUI, UIProduct } from "@/lib/adapters/product.adapter";
import type { Category } from "@/types/database.types";

interface SearchBoxProps {
  className?: string;
  inputClassName?: string;
  onNavigate?: () => void;
}

export default function SearchBox({ className, inputClassName, onNavigate }: SearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setProducts([]);
      setCategories([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [productRes, catRes] = await Promise.all([
          searchProducts(query, 6),
          getCategories(),
        ]);
        setProducts(adaptProductsToUI(productRes.data ?? []));
        const q = query.toLowerCase();
        setCategories((catRes.data ?? []).filter((c) => c.name.toLowerCase().includes(q)));
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
        setOpen(true);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navigate = (url: string) => {
    router.push(url);
    setOpen(false);
    setQuery("");
    onNavigate?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  // Build flat list of all suggestion items for keyboard nav
  const allItems = [
    ...products.map((p) => ({ type: "product" as const, data: p })),
    ...categories.map((c) => ({ type: "category" as const, data: c })),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const item = allItems[activeIndex];
      if (item.type === "product") {
        navigate(`/product/${(item.data as UIProduct).slug}`);
      } else {
        navigate(`/search?q=${encodeURIComponent((item.data as Category).name)}`);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const hasResults = products.length > 0 || categories.length > 0;

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search products..."
            className={`pl-8 ${inputClassName ?? "w-64"}`}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1); }}
            onFocus={() => { if (query.trim() && hasResults) setOpen(true); }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
      </form>

      {open && query.trim() && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[320px] bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
          {loading && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching...</div>
          )}

          {!loading && !hasResults && (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {!loading && products.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Products
              </div>
              {products.map((product, i) => {
                const isActive = activeIndex === i;
                return (
                  <button
                    key={product.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(e) => { e.preventDefault(); navigate(`/product/${product.slug}`); }}
                  >
                    <div className="relative w-10 h-10 rounded-md overflow-hidden bg-gray-100 shrink-0">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-sm font-semibold text-blue-600 shrink-0">
                      {product.salePrice
                        ? `$${product.salePrice.toFixed(2)}`
                        : `$${product.price.toFixed(2)}`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && categories.length > 0 && (
            <div className={products.length > 0 ? "border-t" : ""}>
              <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Categories
              </div>
              {categories.map((cat, i) => {
                const idx = products.length + i;
                const isActive = activeIndex === idx;
                return (
                  <button
                    key={cat.id}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onMouseDown={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(cat.name)}`); }}
                  >
                    <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                      <Tag className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">Search in category</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && hasResults && (
            <div className="border-t">
              <button
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                onMouseDown={(e) => { e.preventDefault(); navigate(`/search?q=${encodeURIComponent(query)}`); }}
              >
                <Search className="w-4 h-4" />
                See all results for &ldquo;{query}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
