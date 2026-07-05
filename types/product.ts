export interface MaterialSpecs {
    gsm?: number;
    composition?: string;
    properties?: string[];
    macroImage?: string;
}

export interface ProductSubVariation {
    size: string;
    clickomVariationId: number;
    sku?: string;
}

export interface Product {
    _id: string;
    title: string;
    slug: string;
    mainImage: string;
    images?: string[];
    sizeGuideImage?: string;
    price: number;
    salePrice?: number;
    createdAt?: string;
    description?: string;
    category: string;
    subCategory?: string;
    type?: string;
    colorName?: string;
    colorHex?: string;
    styleGroup?: string;
    collection?: string;
    sizes?: string[];
    subVariations?: ProductSubVariation[];
    materialSpecs?: MaterialSpecs;
    enablePreOrders?: boolean;
    enableCustomSizes?: boolean;
    isNewArrival?: boolean;
    showLowStock?: boolean;
    manualStockCount?: number;
    isVisible?: boolean;
    clickomProductId?: number;
    stockCount?: number;
    stockStatus?: "in-stock" | "low-stock" | "out-of-stock";
    outOfStockSizes?: string[];
    outOfStockColors?: string[];
}
