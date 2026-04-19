import React from "react";
import CategoryHeader from "@/components/Category/CategoryHeader";
import ListingGrid from "@/components/Category/ListingGrid";
import { abayas, cordSets, tops } from "@/data/products";

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ slug: string[] }>;
}) {
    const { slug } = await params;
    const categoryPath = slug[0]; // Gets 'abayas', 'cord-sets', or 'tops'

    // Determine which product list to show
    let products = abayas;
    if (categoryPath === "cord-sets") products = cordSets;
    if (categoryPath === "tops") products = tops;

    return (
        <main className="flex flex-col min-h-screen bg-white">
            {/* Secondary Category Navigation */}
            <CategoryHeader />
            
            {/* Product Listing Grid */}
            <div className="w-full">
                <ListingGrid products={products} />
            </div>
        </main>
    );
}

export function generateStaticParams() {
    return [
        { slug: ["abayas"] },
        { slug: ["cord-sets"] },
        { slug: ["tops"] },
    ];
}
