"use client";

import React from "react";
import ProductListingCard from "./ProductListingCard";
import { Product } from "@/types/product";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { collectVariationIds, isProductSoldOut, useVariationStockMap } from "@/lib/client/productStock";

interface ListingGridProps {
  products: Product[];
}

const ListingGrid: React.FC<ListingGridProps> = ({ products }) => {
  const stockByVariationId = useVariationStockMap(collectVariationIds(products));

  if (products.length === 0) {
    return (
      <div className="w-full bg-white">
        <EmptyState
          eyebrow="No products"
          title="Nothing Here Yet"
          message="This collection is currently empty. Explore our available pieces while we update this section."
          actionLabel="Browse Collections"
          actionHref="/"
        />
      </div>
    );
  }

  return (
    <div className="w-full bg-white pb-20">
      <div className="w-full">
        {/* The 4-column grid (2 on mobile) with small internal gaps */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
          {products.map((product) => (
            <ProductListingCard
              key={product._id}
              product={product}
              isSoldOut={isProductSoldOut(product, stockByVariationId)}
            />
          ))}
        </div>

        {/* Bottom Navigation Arrows (Bottom-Right aligned) */}
        <div className="mt-12 flex justify-end gap-2 pr-6 md:pr-10">
          <button
            disabled
            className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 text-white flex items-center justify-center cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            disabled
            className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 text-white flex items-center justify-center cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListingGrid;
