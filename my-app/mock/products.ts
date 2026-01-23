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
    },
    {
        id: '5',
        name: 'Denim Jacket',
        category: 'Jackets',
        price: 149.99,
        image: '/products/denim-jacket.jpg',
        description: 'Vintage-style denim jacket for all seasons',
        slug: 'denim-jacket',
        featured: false,
        inStock: true,
    },
    {
        id: '6',
        name: 'Graphic Print Tee',
        category: 'T-Shirts',
        price: 49.99,
        image: '/products/graphic-tee.jpg',
        description: 'Bold graphic print t-shirt with unique design',
        slug: 'graphic-print-tee',
        featured: false,
        inStock: true,
    },
    {
        id: '7',
        name: 'Slim Fit Jeans',
        category: 'Pants',
        price: 89.99,
        image: '/products/jeans-blue.jpg',
        description: 'Classic slim fit jeans in dark wash',
        slug: 'slim-fit-jeans',
        featured: false,
        inStock: true,
    },
    {
        id: '8',
        name: 'Bomber Jacket',
        category: 'Jackets',
        price: 179.99,
        image: '/products/bomber-jacket.jpg',
        description: 'Premium bomber jacket with satin lining',
        slug: 'bomber-jacket',
        featured: false,
        inStock: false,
    },
];

export const getFeaturedProducts = () => products.filter(p => p.featured);
export const getProductBySlug = (slug: string) => products.find(p => p.slug === slug);
