import React from "react";
import CategoryHeader from "@/components/Category/CategoryHeader";
import ListingGrid from "@/components/Category/ListingGrid";
import { abayas, cordSets, tops, occasionWear, dresses, saleProducts } from "@/data/products";

export default async function CategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string[] }>;
    searchParams: Promise<{ style?: string }>;
}) {
    const { slug } = await params;
    const { style: styleQuery } = await searchParams;
    
    const categoryPath = slug[0]; // 'abayas', 'cord-sets', 'tops'
    const subCategoryPath = slug[1]; // optional: 'embroidered', etc.
    
    // Active style is either from path (/category/abayas/coat) or query (?style=coat)
    const activeStyle = subCategoryPath || styleQuery;

    // Determine which product list to show
    let products = abayas;
    if (categoryPath === "cord-sets") products = cordSets;
    if (categoryPath === "tops") products = tops;
    if (categoryPath === "occasion-wear") products = occasionWear;
    if (categoryPath === "dresses") products = dresses;
    if (categoryPath === "sale") products = saleProducts;

    // Filter by sub-category (style) if active
    if (activeStyle) {
        products = products.filter(p => p.subCategory === activeStyle);
    }

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
        { slug: ["occasion-wear"] },
        { slug: ["dresses"] },
        { slug: ["sale"] },
    ];
}
