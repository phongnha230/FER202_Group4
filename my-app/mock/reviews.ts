export interface Review {
    id: string;
    userName: string;
    avatar: string;
    rating: number;
    date: string;
    content: string;
    images?: string[];
}

const reviewImages = [
    "/products/sweater-gray.jpg",
    "/products/cargo-pants-olive.jpg",
    "/products/white-tee.jpg",
    "/products/hoodie-black.jpg",
    "/products/denim-jacket.png",
    "/products/graphic-tee.png",
    "/products/jeans-blue.png",
    "/products/bomber-jacket.png"
];

const avatars = [
    "https://i.pravatar.cc/150?u=1",
    "https://i.pravatar.cc/150?u=2",
    "https://i.pravatar.cc/150?u=3",
    "https://i.pravatar.cc/150?u=4",
    "https://i.pravatar.cc/150?u=5",
];

const customerNames = [
    "Alex Nguyen", "Jordan Smith", "Bao Pham", "Taylor Swift", "Casey Lee",
    "Morgan Brown", "Chris Evans", "Riley Wilson", "Jamie Tran", "Quinn Davis"
];

export const generateReviews = (count: number): Review[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `review-${i + 1}`,
        userName: customerNames[i % customerNames.length],
        avatar: avatars[i % avatars.length],
        rating: 5, // Mostly 5 stars for demo
        date: "2026-01-28",
        content: "Really love this product! The quality is amazing and it fits perfectly. Would definitely recommend to anyone looking for streetwear.",
        images: i % 3 === 0 ? [reviewImages[i % reviewImages.length]] : [], // Every 3rd review has an image
    }));
};

export const reviews = generateReviews(30);
