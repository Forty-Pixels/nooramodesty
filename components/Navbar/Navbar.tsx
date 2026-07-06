"use client";

import Link from "next/link";
import React, { useState } from "react";
import Image from "next/image";
import CartClientIcon from "@/components/Navbar/CartClientIcon";
import MegaMenu from "@/components/Navbar/MegaMenu";
import { X, Menu, Search } from "lucide-react";
import { SearchOverlay } from "@/components/Navbar/SearchOverlay";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <header className={`sticky top-0 z-50 w-full transition-colors duration-500 ${isMenuOpen ? "bg-white text-black" : "bg-black text-white"}`}>
            <div
                className={`absolute inset-y-0 left-0 z-0 w-[max(475px,calc((100vw-1280px)/2+280px))] max-w-[72%] bg-black transition-all duration-500 sm:max-w-none ${isMenuOpen ? "translate-x-0 opacity-100" : "pointer-events-none -translate-x-5 opacity-0"}`}
            />

            <div className="flex items-center justify-between w-full mx-auto max-w-7xl relative z-10 py-2.5 px-6 md:px-10">

                {/* Logo and Left Section */}
                <div className="flex items-center gap-10 w-1/3">
                    <Link
                        href="/"
                        className="flex-shrink-0"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        <Image
                            src="/noora-modesty-logo.png"
                            alt="Noora Modesty Logo"
                            width={120}
                            height={40}
                            className="object-contain h-6 w-auto md:h-8"
                            priority
                        />
                    </Link>
                </div>

                {/* Center Section: Menu Toggle (Desktop only) */}
                <div className="hidden md:flex flex-1 justify-center w-1/3 text-xs md:text-sm">
                    {!isMenuOpen && (
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="font-bold tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
                        >
                            MENU =
                        </button>
                    )}
                </div>

                {/* Right Section: Actions */}
                <div className="flex items-center justify-end w-1/3 min-h-[32px]">
                    {isMenuOpen ? (
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                            aria-label="Close menu"
                        >
                            <X size={26} strokeWidth={1.5} className="text-black" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-4">
                            {/* Desktop: Cart Icon */}
                            <div className="hidden md:block">
                                <CartClientIcon />
                            </div>

                            {/* Mobile: Cart Icon */}
                            <div className="md:hidden">
                                <CartClientIcon variant="minimal" />
                            </div>

                            {/* Search Icon */}
                            <button
                                onClick={() => {
                                    setIsSearchOpen(true);
                                    setIsMenuOpen(false);
                                }}
                                className="p-1.5 hover:opacity-70 transition-opacity cursor-pointer"
                                aria-label="Open search"
                            >
                                <Search size={22} strokeWidth={1.5} className={isMenuOpen ? "text-black" : "text-white"} />
                            </button>

                            {/* Mobile: Hamburger Menu icon */}
                            <button
                                onClick={() => setIsMenuOpen(true)}
                                className="md:hidden p-1.5 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                                aria-label="Open menu"
                            >
                                <Menu size={26} strokeWidth={1.5} className="text-white" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <MegaMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </header>
    );
};

export default Navbar;
