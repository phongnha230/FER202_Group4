export interface Product {
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
    colorImages?: Record<string, string>; // Maps color name to image URL
    sizes?: string[];
    isNew?: boolean;
    salePrice?: number;
}

export const products: Product[] = [
    {
        id: '1',
        name: 'Oversized Knit Sweater',
        category: 'Sweaters',
        price: 89.99,
        image: '/products/sweater-gray.jpg',
        description: 'Cozy oversized knit sweater perfect for casual streetwear looks',
        slug: 'oversized-knit-sweater',
        featured: true,
        inStock: true,
        colors: ['Gray', 'Black', 'Beige'],
        sizes: ['S', 'M', 'L', 'XL'],
        isNew: true,
    },
    {
        id: '2',
        name: 'Cargo Utility Pants',
        category: 'Pants',
        price: 119.99,
        image: '/products/cargo-pants-olive.jpg',
        description: 'Military-inspired cargo pants with multiple pockets',
        slug: 'cargo-utility-pants',
        featured: true,
        inStock: true,
        colors: ['Olive', 'Black', 'Khaki'],
        sizes: ['S', 'M', 'L'],
        isNew: true,
    },
    {
        id: '3',
        name: 'Essential White Tee',
        category: 'T-Shirts',
        price: 39.99,
        image: '/products/white-tee.jpg',
        description: 'Premium cotton essential white t-shirt',
        slug: 'essential-white-tee',
        featured: true,
        inStock: true,
        colors: ['White', 'Black'],
        sizes: ['S', 'M', 'L', 'XL'],
        isNew: true,
    },
    {
        id: '4',
        name: 'Urban Hoodie',
        category: 'Hoodies',
        price: 99.99,
        image: '/products/hoodie-black.jpg',
        description: 'Classic urban hoodie with premium fabric',
        slug: 'urban-hoodie',
        featured: true,
        inStock: true,
        colors: ['Black', 'Gray', 'Navy'],
        sizes: ['S', 'M', 'L'],
        salePrice: 79.99,
    },
    {
        id: '5',
        name: 'Denim Jacket',
        category: 'Jackets',
        price: 149.99,
        image: '/products/denim-jacket.png',
        description: 'Vintage-style denim jacket for all seasons',
        slug: 'denim-jacket',
        featured: false,
        inStock: true,
        colors: ['Blue', 'Black'],
        sizes: ['M', 'L', 'XL'],
        salePrice: 129.99,
    },
    {
        id: '6',
        name: 'Graphic Print Tee',
        category: 'T-Shirts',
        price: 49.99,
        image: '/products/graphic-tee.png',
        description: 'Bold graphic print t-shirt with unique design',
        slug: 'graphic-print-tee',
        featured: false,
        inStock: true,
        colors: ['White', 'Black'],
        sizes: ['S', 'M', 'L'],
        salePrice: 44.99,
    },
    {
        id: '7',
        name: 'Slim Fit Jeans',
        category: 'Pants',
        price: 89.99,
        image: '/products/jeans-blue.png',
        description: 'Classic slim fit jeans in dark wash',
        slug: 'slim-fit-jeans',
        featured: false,
        inStock: true,
        colors: ['Blue', 'Black'],
        sizes: ['S', 'M', 'L', 'XL'],
        salePrice: 79.99,
    },
    {
        id: '8',
        name: 'Bomber Jacket',
        category: 'Jackets',
        price: 179.99,
        image: '/products/bomber-jacket.png',
        description: 'Premium bomber jacket with satin lining',
        slug: 'bomber-jacket',
        featured: false,
        inStock: false,
        colors: ['Black', 'Green'],
        sizes: ['M', 'L'],
    },

];

export const getFeaturedProducts = () => products.filter(p => p.featured);
export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);
