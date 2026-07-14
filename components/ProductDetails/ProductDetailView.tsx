"use client";

import { useState } from "react";
import { Product } from "@/types/product";
import { ProductGallery } from "@/components/ProductDetails/ProductGallery";
import { ProductInfo } from "@/components/ProductDetails/ProductInfo";

interface ProductDetailViewProps {
    product: Product;
    initialStockByVariationId: Record<number, number>;
}

export const ProductDetailView = ({ product, initialStockByVariationId }: ProductDetailViewProps) => {
    const [isSoldOut, setIsSoldOut] = useState(false);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-10 items-start">
            {/* Left: Gallery (6 columns) */}
            <div className="lg:col-span-6 max-w-[760px]">
                <ProductGallery images={product.images || [product.mainImage]} isSoldOut={isSoldOut} />
            </div>

            {/* Right: Info (6 columns) */}
            <div className="lg:col-span-6 lg:pl-8">
                <ProductInfo
                    product={product}
                    initialStockByVariationId={initialStockByVariationId}
                    onSoldOutChange={setIsSoldOut}
                />
            </div>
        </div>
    );
};
