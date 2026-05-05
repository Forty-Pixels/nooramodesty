"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import { products } from "@/data/products";
import ProductListingCard from "@/components/Category/ProductListingCard";
import { Product } from "@/types/product";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SearchOverlay = ({ isOpen, onClose }: SearchOverlayProps) => {
    const [query, setQuery] = useState("");
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (query.trim().length > 0) {
            const searchTerm = query.toLowerCase().trim();
            const results = products.filter((p) => 
                p.title.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm) ||
                p.subCategory?.toLowerCase().includes(searchTerm) ||
                p.collection?.toLowerCase().includes(searchTerm)
            ).slice(0, 4); // Limit to 4 results in overlay
            setFilteredProducts(results);
        } else {
            setFilteredProducts([]);
        }
    }, [query]);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
            onClose();
            setQuery("");
        }
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

                        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto w-full group">
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="TYPE TO SEARCH..."
                                className="w-full bg-transparent border-b border-gray-200 py-3 md:py-6 text-xl md:text-5xl font-bold tracking-tight uppercase text-black placeholder:text-gray-200 focus:outline-none focus:border-black transition-all duration-500"
                            />
                            <button 
                                type="submit"
                                className="absolute right-0 bottom-3 md:bottom-6 p-2 text-gray-300 group-focus-within:text-black transition-colors"
                            >
                                <Search size={24} strokeWidth={1.5} />
                            </button>
                        </form>
                        
                        <div className="max-w-4xl mx-auto w-full mt-6 md:mt-12 overflow-y-auto max-h-[60vh] pb-10">
                            {query.trim().length > 0 ? (
                                <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                        <div className="text-[0.6rem] text-gray-400 font-bold uppercase tracking-widest">Products Found ({filteredProducts.length})</div>
                                        <button 
                                            onClick={handleSubmit}
                                            className="text-[0.6rem] text-black font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                                        >
                                            View All Results →
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
                                            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest italic">No products matching "{query}"</p>
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
                                                setQuery("");
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
