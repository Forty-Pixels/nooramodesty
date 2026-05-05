export interface MaterialSpecs {
    gsm: number;
    composition: string;
    properties: string[];
    macroImage: string;
}

export interface Product {
    _id: string;
    title: string;
    slug: string;
    mainImage: string;
    images?: string[];
    price: number;
    salePrice?: number;
    description?: string;
    category: string;
    subCategory?: string;
    type?: string;
    color?: string;
    collection?: string;
    colors?: string[];
    sizes?: string[];
    materialSpecs?: MaterialSpecs;
}

