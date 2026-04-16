export interface Product {
    _id: string;
    title: string;
    slug: string;
    mainImage: string;
    images?: string[];
    price?: number;
    description?: string;
    category: string;
}
