import { PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Product, ProductVariant, ProductImage, Category } from '@/types/database.types';

export interface ProductWithDetails extends Product {
  category?: { id: number; name: string };
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface ProductFilters {
  category_id?: number;
  status?: 'active' | 'hidden';
  featured?: boolean;
  is_new?: boolean;
  in_stock?: boolean;
  min_price?: number;
  max_price?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get all products with optional filters
 */
export async function getProducts(filters?: ProductFilters): Promise<{ data: ProductWithDetails[]; error: PostgrestError | null }> {
  let query = supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  } else {
    // Default to active products only
    query = query.eq('status', 'active');
  }

  if (filters?.featured !== undefined) {
    query = query.eq('featured', filters.featured);
  }

  if (filters?.is_new !== undefined) {
    query = query.eq('is_new', filters.is_new);
  }

  if (filters?.in_stock !== undefined) {
    query = query.eq('in_stock', filters.in_stock);
  }

  if (filters?.min_price) {
    query = query.gte('base_price', filters.min_price);
  }

  if (filters?.max_price) {
    query = query.lte('base_price', filters.max_price);
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  return { data: data || [], error };
}

/**
 * Get a single product with all details
 */
export async function getProduct(id: string): Promise<{ data: ProductWithDetails | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Get a product by slug
 */
export async function getProductBySlug(slug: string): Promise<{ data: ProductWithDetails | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(id, name),
      variants:product_variants(*),
      images:product_images(*)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  return { data, error };
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(limit = 8): Promise<{ data: ProductWithDetails[]; error: PostgrestError | null }> {
  return getProducts({ featured: true, status: 'active', limit });
}

/**
 * Get new products
 */
export async function getNewProducts(limit = 8): Promise<{ data: ProductWithDetails[]; error: PostgrestError | null }> {
  return getProducts({ is_new: true, status: 'active', limit });
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  categoryId: number,
  limit?: number
): Promise<{ data: ProductWithDetails[]; error: PostgrestError | null }> {
  return getProducts({ category_id: categoryId, status: 'active', limit });
}

/**
 * Search products
 */
export async function searchProducts(
  searchTerm: string,
  limit = 20
): Promise<{ data: ProductWithDetails[]; error: PostgrestError | null }> {
  return getProducts({ search: searchTerm, status: 'active', limit });
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<{ data: Category[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return { data: data || [], error };
}

/**
 * Get product variants for a specific product
 */
export async function getProductVariants(productId: string): Promise<{ data: ProductVariant[]; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('color, size');

  return { data: data || [], error };
}

/**
 * Check variant stock availability
 */
export async function checkVariantStock(variantId: string): Promise<{ inStock: boolean; stock: number; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('stock')
    .eq('id', variantId)
    .single();

  if (error) {
    return { inStock: false, stock: 0, error };
  }

  return {
    inStock: data.stock > 0,
    stock: data.stock,
    error: null,
  };
}
