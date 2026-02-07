import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProductBySlug } from '@/lib/api/product.api';
import { adaptProductToUI } from '@/lib/adapters/product.adapter';
import ProductContainer from '@/components/product/ProductContainer';
import ProductReviews from '@/components/product/ProductReviews';
import Link from 'next/link';

// In Next.js 15+, params is a Promise.
type Props = {
    params: Promise<{
        slug: string;
    }>;
};

export default async function ProductPage({ params }: Props) {
    const { slug } = await params;
    const supabase = await createClient();
    const { data: product, error } = await getProductBySlug(slug, supabase);

    if (error || !product) {
        notFound();
    }

    const uiProduct = adaptProductToUI(product);

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <nav className="flex text-sm text-gray-500 mb-8" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                    <li>
                        <Link href="/" className="hover:text-gray-900 transition-colors">
                            Home
                        </Link>
                    </li>
                    <li>/</li>
                    <li>
                        <Link href={`/${uiProduct.category.toLowerCase()}`} className="hover:text-gray-900 transition-colors">
                            {uiProduct.category}
                        </Link>
                    </li>
                    <li>/</li>
                    <li className="text-gray-900 font-medium truncate" aria-current="page">
                        {uiProduct.name}
                    </li>
                </ol>
            </nav>

            <ProductContainer product={uiProduct} />

            <ProductReviews productId={product.id} />
        </div>
    );
}
