import React from "react";
import ListingGrid from "@/components/Category/ListingGrid";
import { ListingControls } from "@/components/Category/ListingControls";
import { getAllProducts } from "@/lib/sanity/products";
import { getProductFacets } from "@/utils/productFilters";

export default async function ShopPage() {
    const products = await getAllProducts();
    const facets = getProductFacets(products);

    return (
        <main className="flex min-h-screen flex-col bg-white">
            <div className="border-b border-gray-100 bg-white px-6 py-14 text-center md:py-20">
                <h1 className="text-3xl font-bold uppercase tracking-[0.18em] text-black md:text-4xl">
                    Shop All
                </h1>
                <p className="mx-auto mt-4 max-w-md text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                    Discover the full Noora Modesty collection.
                </p>
            </div>
            <ListingControls facets={facets} resultCount={products.length} showCategoryFilter />
            <ListingGrid products={products} />
        </main>
    );
}
