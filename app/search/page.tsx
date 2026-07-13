import React, { Suspense } from "react";
import ListingGrid from "@/components/Category/ListingGrid";
import { ListingControls } from "@/components/Category/ListingControls";
import { getAllProducts } from "@/lib/sanity/products";
import { Search } from "lucide-react";
import { filterAndSortProducts, getProductFacets, hasActiveProductFilters, ProductFilterParams } from "@/utils/productFilters";
import { EmptyState } from "@/components/ui/EmptyState";

interface SearchPageProps {
    searchParams: Promise<ProductFilterParams>;
}

const SearchResults = async ({ searchParams }: SearchPageProps) => {
    const filters = await searchParams;
    const searchTerm = filters.q?.toLowerCase().trim() || "";
    const hasActiveFilters = hasActiveProductFilters(filters);

    const products = await getAllProducts();
    const facets = getProductFacets(products);
    const filteredProducts = hasActiveFilters ? filterAndSortProducts(products, filters) : [];

    return (
        <div className="flex flex-col">
            {/* Search Header */}
            <div className="bg-white border-b border-gray-100 py-12 md:py-20">
                <div className="mx-auto max-w-7xl px-6 md:px-10 flex flex-col items-center text-center">
                    <h1 className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-[0.4em] uppercase text-gray-400 mb-4">
                        Search Results
                    </h1>
                    <div className="flex items-center gap-4">
                        <Search size={24} className="text-black" />
                        <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight italic">
                            {searchTerm ? `"${searchTerm}"` : hasActiveFilters ? "Filtered Products" : "Enter a search term"}
                        </h2>
                    </div>
                    <p className="mt-4 text-[10px] md:text-xs font-bold tracking-widest text-gray-400 uppercase">
                        {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"} Found
                    </p>
                </div>
            </div>

            <ListingControls facets={facets} resultCount={filteredProducts.length} showCategoryFilter />

            {/* Results Grid */}
            <div className="bg-white min-h-[50vh] py-10">
                {filteredProducts.length > 0 ? (
                    <ListingGrid products={filteredProducts} />
                ) : (
                    <EmptyState
                        eyebrow="No results"
                        title="No Match Found"
                        message="Try a broader search term or reset your filters to browse more pieces."
                        actionLabel="Browse Collections"
                        actionHref="/"
                    />
                )}
            </div>
        </div>
    );
};

export default function SearchPage({ searchParams }: SearchPageProps) {
    return (
        <main className="bg-white min-h-screen">
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-[70vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                </div>
            }>
                <SearchResults searchParams={searchParams} />
            </Suspense>
        </main>
    );
}
