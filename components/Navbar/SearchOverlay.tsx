"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { products } from "@/data/products";
import ProductListingCard from "@/components/Category/ProductListingCard";
import { Product } from "@/types/product";
import { FilterDrawer } from "@/components/Category/FilterDrawer";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import {
    filterAndSortProducts,
    getProductFacets,
    sortFilterOptions,
} from "@/utils/productFilters";
import { validatePriceRange } from "@/utils/formValidation";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("");
    const [color, setColor] = useState("");
    const [size, setSize] = useState("");
    const [availability, setAvailability] = useState("");
    const [sort, setSort] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [searchError, setSearchError] = useState("");
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const facets = getProductFacets(products);

    useEffect(() => {
        const hasActiveFilters = Boolean(
            query.trim() ||
            category ||
            color ||
            size ||
            availability ||
            sort ||
            minPrice ||
            maxPrice,
        );

        if (hasActiveFilters) {
            const results = filterAndSortProducts(products, {
                q: query,
                category,
                color,
                size,
                availability,
                sort,
                minPrice,
                maxPrice,
            }).slice(0, 4);
            setFilteredProducts(results);
        } else {
            setFilteredProducts([]);
        }
    }, [availability, category, color, maxPrice, minPrice, query, size, sort]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const buildSearchUrl = () => {
        const params = new URLSearchParams();
        const values = {
            q: query.trim(),
            category,
            color,
            size,
            availability,
            minPrice: minPrice.trim(),
            maxPrice: maxPrice.trim(),
            sort,
        };

        Object.entries(values).forEach(([key, value]) => {
            if (value) params.set(key, value);
        });

        const queryString = params.toString();
        return queryString ? `/search?${queryString}` : "/search";
    };

    const resetSearchState = () => {
        setQuery("");
        setCategory("");
        setColor("");
        setSize("");
        setAvailability("");
        setSort("");
        setMinPrice("");
        setMaxPrice("");
        setIsFilterOpen(false);
        setSearchError("");
    };

    const goToResults = () => {
        const priceErrors = validatePriceRange(minPrice, maxPrice);

        if (priceErrors.length > 0) {
            setSearchError(priceErrors[0]);
            return;
        }

        setSearchError("");
        router.push(buildSearchUrl());
        onClose();
        resetSearchState();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        goToResults();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                    className="fixed inset-0 z-[100] bg-white flex flex-col"
                >
                    <div className="mx-auto max-w-7xl w-full px-6 md:px-10 py-4 md:py-6 overflow-y-auto h-full">
                        <div className={`flex justify-between items-center transition-all duration-300 ${query.length > 0 ? "h-0 opacity-0 mb-0 pointer-events-none md:h-auto md:opacity-100 md:mb-20 md:pointer-events-auto" : "h-auto opacity-100 mb-10 md:mb-20"}`}>
                             <div className="w-10 h-10 hidden md:block" /> {/* Spacer */}
                             <div className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-[0.4em] uppercase text-black">
                                Search Noora
                             </div>
                             <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                                aria-label="Close search"
                             >
                                <X size={28} strokeWidth={1.5} className="text-black" />
                             </button>
                        </div>

                        {/* Mobile Close Button (Visible when title is hidden) */}
                        {query.length > 0 && (
                            <div className="md:hidden flex justify-end mb-2">
                                <button onClick={onClose} className="p-1">
                                    <X size={24} strokeWidth={1.5} className="text-black" />
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className="relative max-w-4xl mx-auto w-full group">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="TYPE TO SEARCH..."
                                className="w-full bg-transparent border-b border-gray-300 py-3 md:py-6 text-xl md:text-5xl font-bold tracking-tight uppercase text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-all duration-500"
                            />
                            <button 
                                type="submit"
                                className="absolute right-0 bottom-3 md:bottom-6 p-2 text-gray-300 group-focus-within:text-black transition-colors"
                            >
                                <Search size={24} strokeWidth={1.5} />
                            </button>
                        </form>

                        <div className="max-w-4xl mx-auto w-full mt-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="button"
                                    onClick={() => setIsFilterOpen((current) => !current)}
                                    className="inline-flex h-10 items-center gap-3 text-[0.6rem] font-bold uppercase tracking-[0.28em] text-black transition-opacity hover:opacity-70"
                                >
                                    <SlidersHorizontal size={14} strokeWidth={1.5} />
                                    Filters
                                </button>
                                <FilterDropdown label="Sort By" value={sort} options={sortFilterOptions} onChange={setSort} />
                            </div>

                            {searchError && (
                                <p className="text-[10px] font-bold uppercase tracking-widest text-[#B21E1E]" aria-live="polite">{searchError}</p>
                            )}

                            <FilterDrawer
                                isOpen={isFilterOpen}
                                facets={facets}
                                resultCount={filteredProducts.length}
                                showCategoryFilter
                                values={{ category, availability, size, color, minPrice, maxPrice }}
                                onChange={(updates) => {
                                    if (typeof updates.category === "string") setCategory(updates.category);
                                    if (typeof updates.availability === "string") setAvailability(updates.availability);
                                    if (typeof updates.size === "string") setSize(updates.size);
                                    if (typeof updates.color === "string") setColor(updates.color);
                                    if (typeof updates.minPrice === "string") setMinPrice(updates.minPrice);
                                    if (typeof updates.maxPrice === "string") setMaxPrice(updates.maxPrice);
                                }}
                                onClear={resetSearchState}
                                onClose={() => setIsFilterOpen(false)}
                                onPrimaryAction={goToResults}
                                primaryActionLabel="View Results"
                            />
                        </div>
                        
                        <div className="max-w-4xl mx-auto w-full mt-6 md:mt-12 overflow-y-auto max-h-[60vh] pb-10">
                            {query.trim().length > 0 || category || color || size || availability || sort || minPrice || maxPrice ? (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">Products Found ({filteredProducts.length})</div>
                                        <button 
                                            onClick={goToResults}
                                            className="text-[0.6rem] text-black font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                                        >
                                            View All Results -&gt;
                                        </button>
                                    </div>
                                    
                                    {filteredProducts.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            {filteredProducts.map((product) => (
                                                <div key={product._id} onClick={onClose}>
                                                    <ProductListingCard product={product} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-10 text-center">
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest italic">No products match the selected search</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-x-8 gap-y-4">
                                    <div className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest w-full mb-2">Trending Searches</div>
                                    {["Abayas", "Cord Sets", "Embroidered", "Coat Abayas"].map((item) => (
                                        <button
                                            key={item}
                                            onClick={() => {
                                                setQuery(item);
                                                router.push(`/search?q=${encodeURIComponent(item)}`);
                                                onClose();
                                                resetSearchState();
                                            }}
                                            className="text-xs font-bold uppercase tracking-[0.2em] text-black hover:text-[#8B8378] transition-colors border-b border-transparent hover:border-[#8B8378] pb-1"
                                        >
                                            {item}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
