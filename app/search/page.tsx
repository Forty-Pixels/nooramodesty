import React, { Suspense } from "react";
import ListingGrid from "@/components/Category/ListingGrid";
import { products } from "@/data/products";
import Link from "next/link";
import { Search } from "lucide-react";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

const SearchResults = async ({ searchParams }: SearchPageProps) => {
    const { q: query } = await searchParams;
    const searchTerm = query?.toLowerCase().trim() || "";

    const filteredProducts = products.filter((product) => {
        if (!searchTerm) return false;
        
        return (
            product.title.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm) ||
            product.subCategory?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm) ||
            product.collection?.toLowerCase().includes(searchTerm) ||
            product.type?.toLowerCase().includes(searchTerm)
        );
    });

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
                            {searchTerm ? `"${searchTerm}"` : "Enter a search term"}
                        </h2>
                    </div>
                    <p className="mt-4 text-[10px] md:text-xs font-bold tracking-widest text-gray-400 uppercase">
                        {filteredProducts.length} {filteredProducts.length === 1 ? "Product" : "Products"} Found
                    </p>
                </div>
            </div>

            {/* Results Grid */}
            <div className="bg-white min-h-[50vh] py-10">
                {filteredProducts.length > 0 ? (
                    <ListingGrid products={filteredProducts} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <Search size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold uppercase tracking-widest mb-2">No Results Found</h3>
                        <p className="text-sm text-gray-500 max-w-md mb-8">
                            We couldn't find any products matching your search. Try checking your spelling or using more general terms.
                        </p>
                        <Link 
                            href="/category/abayas" 
                            className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                        >
                            Browse All Products
                        </Link>
                    </div>
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
