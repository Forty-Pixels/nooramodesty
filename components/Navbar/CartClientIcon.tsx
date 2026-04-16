"use client";

import React from "react";
import Link from "next/link";
import useCartStore from "@/store";

const CartClientIcon = () => {
    const { items } = useCartStore();
    const count = items?.length || 0;

    return (
        <Link
            href="/cart"
            className="bg-white text-black px-4 py-1.5 text-[0.7rem] md:text-[0.75rem] font-medium tracking-[0.15em] uppercase hover:bg-gray-100 transition-colors flex items-center whitespace-nowrap"
        >
            SHOPPING BAG {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
        </Link>
    );
};

export default CartClientIcon;
