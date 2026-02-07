import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Product, ProductVariant, ProductImage, Category } from '@/types/database.types';

export interface ProductWithDetails extends Product {
  category?: { id: number; name: string };
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface ProductFilters {
  category_id?: number;
  status?: 'active' | 'hidden' | 'all';
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
  try {
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
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      // If status is 'all', don't filter by status (for admin)
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

    if (error) {
      console.error('Supabase query error:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  } catch (err) {
    console.error('Unexpected error in getProducts:', err);
    return { 
      data: [], 
      error: { 
        message: err instanceof Error ? err.message : 'Unknown error',
        details: '',
        hint: '',
        code: 'UNKNOWN'
      } as PostgrestError 
    };
  }
}

/**
 * Get a single product with all details
 */
export async function getProduct(id: string, client: SupabaseClient = supabase): Promise<{ data: ProductWithDetails | null; error: PostgrestError | null }> {
  const { data, error } = await client
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
export async function getProductBySlug(slug: string, client: SupabaseClient = supabase): Promise<{ data: ProductWithDetails | null; error: PostgrestError | null }> {
  const { data, error } = await client
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

/**
 * Update product status (active/hidden)
 */
export async function updateProductStatus(
  productId: string, 
  status: 'active' | 'hidden'
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const { error } = await supabase
    .from('products')
    .update({ status })
    .eq('id', productId);

  if (error) {
    console.error('Error updating product status:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

/**
 * Toggle product visibility
 */
export async function toggleProductVisibility(
  productId: string,
  currentStatus: 'active' | 'hidden'
): Promise<{ newStatus: 'active' | 'hidden'; success: boolean; error: PostgrestError | null }> {
  const newStatus = currentStatus === 'active' ? 'hidden' : 'active';
  const { success, error } = await updateProductStatus(productId, newStatus);
  
  return { newStatus, success, error };
}

/**
 * Update product details
 */
export interface UpdateProductData {
  name?: string;
  description?: string;
  base_price?: number;
  sale_price?: number | null;
  category_id?: number;
  status?: 'active' | 'hidden';
  featured?: boolean;
  is_new?: boolean;
  in_stock?: boolean;
  image?: string;
  slug?: string;
}

/**
 * Create product variants in bulk
 */
export interface NewVariant {
  size: string;
  color: string;
  price: number;
  stock: number;
}

export async function createProductVariants(
  productId: string,
  variants: NewVariant[]
): Promise<{ success: boolean; error: PostgrestError | null }> {
  if (!variants.length) {
    return { success: true, error: null };
  }

  const { error } = await supabase
    .from('product_variants')
    .insert(
      variants.map((variant) => ({
        product_id: productId,
        size: variant.size,
        color: variant.color,
        price: variant.price,
        stock: variant.stock,
      }))
    );

  if (error) {
    console.error('Error creating product variants:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

export async function updateProduct(
  productId: string,
  data: UpdateProductData
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const { error } = await supabase
    .from('products')
    .update(data)
    .eq('id', productId);

  if (error) {
    console.error('Error updating product:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}

/**
 * Create a new product
 */
export async function createProduct(
  data: Omit<UpdateProductData, 'status'> & { name: string; base_price: number }
): Promise<{ data: Product | null; error: PostgrestError | null }> {
  const { data: product, error } = await supabase
    .from('products')
    .insert({
      ...data,
      status: 'active',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    return { data: null, error };
  }

  return { data: product, error: null };
}

/**
 * Delete a product
 */
export async function deleteProduct(
  productId: string
): Promise<{ success: boolean; error: PostgrestError | null }> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('Error deleting product:', error);
    return { success: false, error };
  }

  return { success: true, error: null };
}
