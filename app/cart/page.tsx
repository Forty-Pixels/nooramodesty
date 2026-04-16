"use client";

import React from "react";
import useCartStore from "@/store";
import Link from "next/link";

export default function CartPage() {
    const { items } = useCartStore();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <h1 className="text-3xl md:text-4xl font-light uppercase tracking-widest mb-4">
                Shopping Bag
            </h1>
            {items.length === 0 ? (
                <div className="flex flex-col items-center gap-6">
                    <p className="text-gray-500 max-w-md uppercase text-xs tracking-[0.2em]">
                        Your bag is currently empty.
                    </p>
                    <Link
                        href="/shop"
                        className="bg-black text-white px-8 py-3 text-xs tracking-[0.3em] font-medium uppercase hover:bg-zinc-800 transition-colors"
                    >
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <p>Bag content will be listed here.</p>
            )}
        </div>
    );
}
