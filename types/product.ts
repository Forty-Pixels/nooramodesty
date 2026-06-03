export interface MaterialSpecs {
    gsm: number;
    composition: string;
    properties: string[];
    macroImage: string;
}

export interface ProductSubVariation {
    size: string;
    clickomVariationId: number;
    sku?: string;
}

export interface ProductVariation {
    name: string;
    colorHex?: string;
    clickomVariationId?: number;
    subVariations: ProductSubVariation[];
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
    variations?: ProductVariation[];
    materialSpecs?: MaterialSpecs;
    enablePreOrders?: boolean;
    enableCustomSizes?: boolean;
    isVisible?: boolean;
    clickomProductId?: number;
    stockCount?: number;
    stockStatus?: "in-stock" | "low-stock" | "out-of-stock";
    outOfStockSizes?: string[];
    outOfStockColors?: string[];
}
