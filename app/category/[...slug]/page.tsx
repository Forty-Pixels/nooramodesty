import React from "react";
import CategoryHeader from "@/components/Category/CategoryHeader";
import ListingGrid from "@/components/Category/ListingGrid";
import { ListingControls } from "@/components/Category/ListingControls";
import { getProductsByCategory } from "@/lib/sanity/products";
import { filterAndSortProducts, getProductFacets, ProductFilterParams } from "@/utils/productFilters";
import { redirect } from "next/navigation";

export default async function CategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string[] }>;
    searchParams: Promise<ProductFilterParams & { style?: string }>;
}) {
    const { slug } = await params;
    const searchParamsValue = await searchParams;
    const { style: styleQuery } = searchParamsValue;
    
    const categoryPath = slug[0];
    const subCategoryPath = slug[1];
    const activeStyle = subCategoryPath || styleQuery;

    if (categoryPath === "sale") {
        redirect(`/category/clearance${subCategoryPath ? `/${subCategoryPath}` : ""}`);
    }

    let products = await getProductsByCategory(categoryPath);

    if (activeStyle) {
        if (categoryPath === "clearance") {
            products = products.filter(p => p.category === activeStyle);
        } else {
            products = products.filter(p => p.subCategory === activeStyle);
        }
    }

    const facets = getProductFacets(products);

    products = filterAndSortProducts(products, {
        ...searchParamsValue,
        category: "",
    });

    return (
        <main className="flex flex-col min-h-screen bg-white">
            <CategoryHeader />
            <ListingControls facets={facets} resultCount={products.length} />
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
        { slug: ["clearance"] },
        { slug: ["clearance", "abayas"] },
        { slug: ["clearance", "cord-sets"] },
        { slug: ["clearance", "tops"] },
        { slug: ["clearance", "dresses"] },
    ];
}
