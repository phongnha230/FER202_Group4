import { ProductWithDetails } from '@/lib/api/product.api';

/**
 * Product type adapter
 * Maps Supabase ProductWithDetails to the format expected by UI components
 */
export interface UIProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  slug: string;
  featured?: boolean;
  inStock?: boolean;
  colors?: string[];
  colorImages?: Record<string, string>;
  sizes?: string[];
  isNew?: boolean;
  salePrice?: number;
}

/**
 * Convert Supabase ProductWithDetails to UIProduct format
 */
export function adaptProductToUI(product: ProductWithDetails): UIProduct {
  // Extract unique colors and sizes from variants
  const colors = product.variants
    ? Array.from(new Set(product.variants.map(v => v.color)))
    : undefined;
  
  const sizes = product.variants
    ? Array.from(new Set(product.variants.map(v => v.size)))
    : undefined;

  // Build color images map from product_images
  const colorImages: Record<string, string> = {};
  if (product.images) {
    product.images.forEach(img => {
      if (img.color && !colorImages[img.color]) {
        colorImages[img.color] = img.image_url;
      }
    });
  }

  // Get main image (prioritize is_main=true, fallback to first image or product.image)
  const mainImage = product.images?.find(img => img.is_main)?.image_url 
    || product.images?.[0]?.image_url 
    || product.image 
    || '';

  return {
    id: product.id,
    name: product.name,
    category: product.category?.name || '',
    price: product.base_price,
    image: mainImage,
    description: product.description || '',
    slug: product.slug || '',
    featured: product.featured,
    inStock: product.in_stock,
    colors,
    colorImages: Object.keys(colorImages).length > 0 ? colorImages : undefined,
    sizes,
    isNew: product.is_new,
    salePrice: product.sale_price || undefined,
  };
}

/**
 * Convert array of ProductWithDetails to UIProduct array
 */
export function adaptProductsToUI(products: ProductWithDetails[]): UIProduct[] {
  return products.map(adaptProductToUI);
}
