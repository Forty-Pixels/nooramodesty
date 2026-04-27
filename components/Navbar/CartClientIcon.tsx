"use client";

import React from "react";
import Link from "next/link";
import useCartStore from "@/store";

interface CartClientIconProps {
    variant?: 'default' | 'minimal';
}

const CartClientIcon = ({ variant = 'default' }: CartClientIconProps) => {
    const { items } = useCartStore();
    const count = items?.length || 0;

    if (variant === 'minimal') {
        return (
            <Link
                href="/cart"
                className="relative p-1.5 transition-opacity hover:opacity-70 flex items-center"
                aria-label="Shopping bag"
            >
                <svg
                    width="20"
                    height="22"
                    viewBox="0 0 14 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-auto"
                >
                    <path
                        d="M1 5V13.5C1 14.3284 1.67157 15 2.5 15H11.5C12.3284 15 13 14.3284 13 13.5V5H1ZM4 5H10V4C10 2.34315 8.65685 1 7 1C5.34315 1 4 2.34315 4 4V5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-black text-[8px] font-bold w-[15px] h-[15px] flex items-center justify-center rounded-full border border-black/10">
                        {count}
                    </span>
                )}
            </Link>
        );
    }

    return (
        <Link
            href="/cart"
            className="group bg-white text-black px-4 py-1.5 text-[0.7rem] md:text-[0.75rem] font-medium tracking-[0.15em] uppercase hover:bg-gray-100 transition-colors flex items-center gap-2 whitespace-nowrap"
        >
            <span>SHOPPING BAG</span>
            <div className="relative flex items-center">
                <svg
                    width="14"
                    height="16"
                    viewBox="0 0 14 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-0.5"
                >
                    <path
                        d="M1 5V13.5C1 14.3284 1.67157 15 2.5 15H11.5C12.3284 15 13 14.3284 13 13.5V5H1ZM4 5H10V4C10 2.34315 8.65685 1 7 1C5.34315 1 4 2.34315 4 4V5Z"
                        stroke="black"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>
                {count > 0 && (
                    <span className="ml-1.5 opacity-60 text-[0.65rem] font-bold">
                        ({count})
                    </span>
                )}
            </div>
        </Link>
    );
};

export default CartClientIcon;
