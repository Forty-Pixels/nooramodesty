"use client";

import React from "react";
import useCartStore from "@/store";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";

export default function WishlistPage() {
    const { wishlistItems, toggleWishlist } = useCartStore();

    if (wishlistItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center bg-[#f6f5f3]">
                <div className="space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-[0.2em] text-black">
                        Wishlist
                    </h1>
                    <p className="text-gray-500 uppercase text-[10px] tracking-[0.3em] font-medium leading-relaxed">
                        Your wishlist is currently empty. Start liking your favorite pieces to see them here.
                    </p>
                    <Link
                        href="/category/abayas"
                        className="group inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-zinc-800 transition-all active:scale-95"
                    >
                        Explore Pieces
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f6f5f3] min-h-screen">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 md:py-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.3em] text-black">
                            Wishlist
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                            {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'} Saved
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8 md:gap-y-16">
                    {wishlistItems.map((item) => (
                        <div key={item._id} className="group flex flex-col w-full relative animate-in fade-in duration-700">
                            {/* Image Container */}
                            <div className="relative aspect-[3/4] w-full overflow-hidden bg-white">
                                <Link href={`/product/${item.slug}`} className="block h-full w-full">
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                </Link>

                                {/* Remove Button */}
                                <button
                                    onClick={() => toggleWishlist(item)}
                                    className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-all cursor-pointer shadow-sm group/btn"
                                    aria-label="Remove from wishlist"
                                >
                                    <Heart
                                        size={18}
                                        strokeWidth={1.5}
                                        className="fill-[#8B8378] text-[#8B8378] group-hover/btn:scale-110 transition-transform"
                                    />
                                </button>

                                {/* Select Options - Minimalist Overlay */}
                                <Link
                                    href={`/product/${item.slug}`}
                                    className="absolute bottom-0 left-0 w-full bg-black/80 backdrop-blur-md text-white py-4 text-[9px] font-bold uppercase tracking-[0.3em] translate-y-full group-hover:translate-y-0 transition-transform duration-500 flex items-center justify-center gap-2"
                                >
                                    Select Options
                                </Link>
                            </div>

                            {/* Details */}
                            <div className="pt-5 flex flex-col gap-1.5 items-center text-center">
                                <Link href={`/product/${item.slug}`}>
                                    <h3 className="text-[0.7rem] font-bold tracking-[0.2em] uppercase text-black hover:opacity-70 transition-opacity">
                                        {item.title}
                                    </h3>
                                </Link>
                                <p className="text-[0.65rem] text-gray-500 font-medium tracking-wider">
                                    LKR {item.price.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
