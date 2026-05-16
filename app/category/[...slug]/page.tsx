import React from "react";
import CategoryHeader from "@/components/Category/CategoryHeader";
import ListingGrid from "@/components/Category/ListingGrid";
import { ListingControls } from "@/components/Category/ListingControls";
import { Product } from "@/types/product";
import { getProductsByCategory } from "@/lib/sanity/products";

export default async function CategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ slug: string[] }>;
    searchParams: Promise<{ style?: string; sort?: string }>;
}) {
    const { slug } = await params;
    const { style: styleQuery, sort: sortQuery } = await searchParams;
    
    const categoryPath = slug[0];
    const subCategoryPath = slug[1];
    const activeStyle = subCategoryPath || styleQuery;

    let products = await getProductsByCategory(categoryPath);

    if (activeStyle) {
        if (categoryPath === "sale") {
            products = products.filter(p => p.category === activeStyle);
        } else {
            products = products.filter(p => p.subCategory === activeStyle);
        }
    }

    // Sorting Logic
    if (sortQuery) {
        products.sort((a, b) => {
            const getPrice = (product: Product) => product.salePrice || product.price;
            
            switch (sortQuery) {
                case "price-asc":
                    return getPrice(a) - getPrice(b);
                case "price-desc":
                    return getPrice(b) - getPrice(a);
                case "name-asc":
                    return a.title.localeCompare(b.title);
                case "name-desc":
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });
    }

    return (
        <main className="flex flex-col min-h-screen bg-white">
            <CategoryHeader />
            <ListingControls />
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
        { slug: ["sale", "abayas"] },
        { slug: ["sale", "cord-sets"] },
        { slug: ["sale", "tops"] },
        { slug: ["sale", "dresses"] },
    ];
}
