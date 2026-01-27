import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/mock/products';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import Link from 'next/link';

interface ProductPageProps {
    params: {
        slug: string;
    };
}

// In Next.js 15+ or latest 14, params might be a promise or direct, checking usage. 
// Assuming standard Page props for now.
export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params;
    const product = getProductBySlug(slug);

    if (!product) {
        notFound();
    }

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
                        <Link href={`/${product.category.toLowerCase()}`} className="hover:text-gray-900 transition-colors">
                            {product.category}
                        </Link>
                    </li>
                    <li>/</li>
                    <li className="text-gray-900 font-medium truncate" aria-current="page">
                        {product.name}
                    </li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
                <ProductGallery product={product} />
                <ProductInfo product={product} />
            </div>
        </div>
    );
}
