"use client";

import React from "react";
import Link from "next/link";

interface MegaMenuProps {
    isOpen: boolean;
}

const HoverLink = ({ href, children, className = "" }: { href: string, children: React.ReactNode, className?: string }) => (
    <Link
        href={href}
        className={`group relative inline-flex items-center justify-center overflow-hidden px-3 py-1.5 -ml-3 w-max ${className}`}
    >
        <span className="absolute inset-0 w-full h-full bg-black transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></span>
        <span className="relative z-10 group-hover:text-white transition-colors duration-300 ease-out">{children}</span>
    </Link>
);

const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen }) => {
    return (
        <div
            className={`absolute top-full left-0 w-full bg-white text-black overflow-hidden origin-top transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                }`}
        >
            <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 md:py-16 overflow-y-auto max-h-[80vh] md:max-h-none">
                {/* Single layout row transitioning from mobile grid to desktop flex */}
                <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-3 md:flex md:flex-wrap md:gap-16 lg:gap-32 w-full">

                    {/* Abayas Column */}
                    <div className="flex flex-col gap-3">
                        <h3 className="font-medium text-lg mb-1">Abayas</h3>
                        <HoverLink href="/category/abayas/embroidered" className="text-sm text-gray-700">Embroidered</HoverLink>
                        <HoverLink href="/category/abayas/coat" className="text-sm text-gray-700">Coat</HoverLink>
                        <HoverLink href="/category/abayas/wedding" className="text-sm text-gray-700">Wedding wear</HoverLink>
                    </div>

                    {/* Cord sets Column */}
                    <div className="flex flex-col gap-3">
                        <h3 className="font-medium text-lg mb-1">Cord sets</h3>
                        <HoverLink href="/category/cord-sets/embroidered" className="text-sm text-gray-700">Embroidered</HoverLink>
                        <HoverLink href="/category/cord-sets/long" className="text-sm text-gray-700">Long</HoverLink>
                        <HoverLink href="/category/cord-sets/one-piece" className="text-sm text-gray-700">One piece</HoverLink>
                        <HoverLink href="/category/cord-sets/printed" className="text-sm text-gray-700">Printed</HoverLink>
                    </div>

                    {/* Tops Column */}
                    <div className="flex flex-col gap-3">
                        <h3 className="font-medium text-lg mb-1">Tops</h3>
                        <HoverLink href="/category/tops/embroidered" className="text-sm text-gray-700">Embroidered</HoverLink>
                        <HoverLink href="/category/tops/plain" className="text-sm text-gray-700">Plain</HoverLink>
                        <HoverLink href="/category/tops/printed" className="text-sm text-gray-700">Printed</HoverLink>
                    </div>

                    {/* Right Action Links */}
                    <div className="flex flex-col gap-3">
                        <HoverLink href="/account" className="text-[1.05rem] uppercase font-medium">ACCOUNT</HoverLink>
                    </div>

                    <div className="flex flex-col gap-3">
                        <HoverLink href="/wishlist" className="text-[1.05rem] uppercase font-medium">WISH-LIST</HoverLink>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default MegaMenu;
