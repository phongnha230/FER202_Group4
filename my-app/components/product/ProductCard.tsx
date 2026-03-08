'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Loader2, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ClickSpark from '@/components/ui/ClickSpark';
import type { UIProduct } from '@/lib/adapters/product.adapter';
import { getProductCardStat, type ProductCardStats } from '@/lib/api/product-card.api';
import { addToCart as addItemToCart } from '@/lib/cart';
import { addToCart as apiAddToCart } from '@/services/cart.service';
import { softFirework } from '@/lib/confetti';
import { useUserStore } from '@/store/user.store';

interface ProductCardProps {
  product: UIProduct;
}

const DEFAULT_STATS: ProductCardStats = {
  averageRating: 0,
  totalReviews: 0,
  soldCount: 0,
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ProductCard({ product }: ProductCardProps) {
  const selectorRef = useRef<HTMLDivElement | null>(null);
  const variants = useMemo(
    () => (product.variants || []).filter((variant) => (variant.stock || 0) > 0),
    [product.variants]
  );
  const fallbackVariant = variants[0];

  const [stats, setStats] = useState<ProductCardStats>({
    averageRating: product.averageRating || 0,
    totalReviews: product.totalReviews || 0,
    soldCount: product.soldCount || 0,
  });
  const [selectedColor, setSelectedColor] = useState(fallbackVariant?.color || product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(fallbackVariant?.size || product.sizes?.[0] || '');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const availableColors = useMemo(
    () => Array.from(new Set(variants.map((variant) => variant.color))),
    [variants]
  );

  const availableSizes = useMemo(() => {
    if (!selectedColor) {
      return Array.from(new Set(variants.map((variant) => variant.size)));
    }

    return Array.from(
      new Set(
        variants
          .filter((variant) => variant.color === selectedColor)
          .map((variant) => variant.size)
      )
    );
  }, [selectedColor, variants]);

  const selectedVariant = useMemo(
    () =>
      variants.find(
        (variant) => variant.color === selectedColor && variant.size === selectedSize
      ) || null,
    [selectedColor, selectedSize, variants]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      if (product.averageRating || product.totalReviews || product.soldCount) {
        return;
      }

      try {
        const nextStats = await getProductCardStat(product.id);
        if (isMounted) {
          setStats(nextStats);
        }
      } catch (error) {
        console.error('Failed to load product card stats:', error);
        if (isMounted) {
          setStats(DEFAULT_STATS);
        }
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [product.averageRating, product.id, product.soldCount, product.totalReviews]);

  useEffect(() => {
    if (!availableColors.length) {
      return;
    }

    if (!selectedColor || !availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors, selectedColor]);

  useEffect(() => {
    if (!availableSizes.length) {
      return;
    }

    if (!selectedSize || !availableSizes.includes(selectedSize)) {
      setSelectedSize(availableSizes[0]);
    }
  }, [availableSizes, selectedSize]);

  useEffect(() => {
    if (!isSelectorOpen) {
      return;
    }

    function handleOutsideClick(event: MouseEvent) {
      if (!selectorRef.current?.contains(event.target as Node)) {
        setIsSelectorOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isSelectorOpen]);

  const ratingValue = stats.averageRating || 0;
  const soldCount = stats.soldCount || 0;
  const totalReviews = stats.totalReviews || 0;
  const activeImage = product.colorImages?.[selectedColor] || product.image;

  const handleAddToCart = async () => {
    if (!selectedVariant || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFeedback('Preparing your selection...');

    try {
      await wait(2000);

      const { user, isAuthenticated } = useUserStore.getState();
      const price = selectedVariant.price || product.salePrice || product.price;

      if (isAuthenticated && user) {
        const { error } = await apiAddToCart(user.id, {
          variant_id: selectedVariant.id,
          quantity: 1,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('cart-updated'));
        }
      } else {
        addItemToCart({
          id: selectedVariant.id,
          productId: product.id,
          name: product.name,
          price,
          image: activeImage,
          color: selectedColor,
          baseColor: product.colors?.[0],
          size: selectedSize,
          quantity: 1,
          maxStock: selectedVariant.stock,
          lowStock: selectedVariant.stock <= 5,
        });
      }

      softFirework();
      setFeedback(`Added ${selectedSize} / ${selectedColor} to cart`);
      setTimeout(() => {
        setIsSelectorOpen(false);
        setFeedback(null);
      }, 1200);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setFeedback(error instanceof Error ? error.message : 'Failed to add to cart');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ClickSpark
      sparkColor="#ff6b00"
      sparkSize={15}
      sparkRadius={40}
      sparkCount={10}
      duration={600}
    >
      <Card className="group relative gap-0 overflow-visible rounded-[26px] border border-slate-200 border-l-4 border-l-transparent bg-white py-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-l-sky-500 hover:shadow-xl">
        <Link href={`/product/${product.slug}`}>
          <div className="relative aspect-square overflow-hidden rounded-t-[26px] bg-gray-100">
            <Image
              src={activeImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />

            <div className="absolute left-2 top-2 flex flex-col gap-2">
              {product.salePrice && <Badge className="bg-red-600 text-white">SALE</Badge>}
              {product.isNew && <Badge className="bg-blue-600 text-white">NEW</Badge>}
              {!product.inStock && <Badge className="bg-red-500 text-white">Out of Stock</Badge>}
            </div>

            <button
              className="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md opacity-0 transition-opacity duration-300 hover:bg-gray-100 group-hover:opacity-100"
              onClick={(event) => {
                event.preventDefault();
              }}
              aria-label="Add to wishlist"
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>
        </Link>

        <CardContent className="px-5 pt-4 pb-4">
          <Link href={`/product/${product.slug}`}>
            <p className="mb-1 text-xs text-muted-foreground">{product.category}</p>
            <h3 className="mb-2 line-clamp-1 text-lg font-semibold">{product.name}</h3>
            {product.salePrice ? (
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-red-600">${product.salePrice.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground line-through">${product.price.toFixed(2)}</span>
              </div>
            ) : (
              <p className="text-xl font-bold">${product.price.toFixed(2)}</p>
            )}
          </Link>

          <div
            ref={selectorRef}
            className="relative z-10 mt-3"
            onMouseEnter={() => setIsSelectorOpen(true)}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-3 text-sm text-slate-600">
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{ratingValue > 0 ? ratingValue.toFixed(1) : 'New'}</span>
                  {totalReviews > 0 && <span className="text-[11px] text-amber-900/70">({totalReviews})</span>}
                </div>
                <div className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="truncate font-medium text-slate-700">{soldCount > 0 ? `${soldCount} sold` : 'Just arrived'}</span>
              </div>

              <Button
                variant="outline"
                className="h-9 min-w-[86px] shrink-0 rounded-full border-slate-300 bg-white px-3.5 text-slate-800 shadow-none hover:bg-slate-50 hover:text-slate-950"
                disabled={!product.inStock || variants.length === 0}
                onClick={(event) => {
                  event.preventDefault();
                  setIsSelectorOpen((current) => !current);
                }}
              >
                <ShoppingCart className="h-4 w-4" />
                {product.inStock ? 'Cart' : 'Out'}
              </Button>
            </div>

            {isSelectorOpen && product.inStock && variants.length > 0 && (
              <div className="absolute bottom-[calc(100%+10px)] right-0 z-50 w-[min(320px,calc(100vw-3rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.16)]">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Colors</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            selectedColor === color
                              ? 'border-slate-950 bg-slate-950 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                          onClick={(event) => {
                            event.preventDefault();
                            setSelectedColor(color);
                          }}
                        >
                          {color}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Sizes</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`min-w-10 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            selectedSize === size
                              ? 'border-slate-950 bg-slate-950 text-white'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                          }`}
                          onClick={(event) => {
                            event.preventDefault();
                            setSelectedSize(size);
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs text-slate-500">Selected variant</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedVariant ? `${selectedColor} / ${selectedSize}` : 'Choose color and size'}
                    </p>
                    {selectedVariant && <p className="text-xs text-slate-500">{selectedVariant.stock} items ready</p>}
                  </div>
                  <Button
                    className="min-w-[132px] rounded-full bg-[#0f172a] text-white hover:bg-[#1e293b]"
                    disabled={!selectedVariant || isSubmitting}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleAddToCart();
                    }}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                    {isSubmitting ? 'Adding in 2s' : 'Add now'}
                  </Button>
                </div>

                {feedback && <p className="mt-3 text-xs font-medium text-slate-600">{feedback}</p>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </ClickSpark>
  );
}


