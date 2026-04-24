"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import useCartStore from "@/store";

interface MegaMenuProps {
    isOpen: boolean;
    onClose: () => void;
}

const HoverLink = ({ href, children, className = "", onClick }: { href: string, children: React.ReactNode, className?: string, onClick?: () => void }) => (
    <Link
        href={href}
        onClick={onClick}
        className={`group relative inline-flex items-center justify-center overflow-hidden px-3 py-1.5 -ml-3 w-max transition-all duration-300 ${className}`}
    >
        <span className="absolute inset-0 w-full h-full bg-black transform translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] z-0"></span>
        <span className="relative z-10 group-hover:text-white transition-colors duration-300 ease-out">{children}</span>
    </Link>
);

const AccordionItem = ({ title, children, isOpen, onClick, onClose }: { title: string, children: React.ReactNode, isOpen: boolean, onClick: () => void, onClose: () => void }) => (
    <div className="border-b border-gray-100 last:border-0 grow">
        <div className="flex items-center justify-between w-full py-4 text-left">
            <HoverLink 
                href={`/category/${title.toLowerCase().replace(/\s+/g, '-')}`} 
                onClick={onClose}
                className="font-medium text-[1.1rem] uppercase tracking-wider z-10 !-ml-3"
            >
                {title}
            </HoverLink>
            <button 
                onClick={onClick}
                className="grow flex justify-end items-center"
                aria-label={isOpen ? "Collapse" : "Expand"}
            >
                {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </button>
        </div>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="flex flex-col gap-3 pb-6">
                        {children}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen, onClose }) => {
    const [activeAccordion, setActiveAccordion] = useState<string | null>("Abayas");
    const [isMobile, setIsMobile] = useState(false);
    const { items, wishlistItems } = useCartStore();
    const cartCount = items?.length || 0;
    const wishlistCount = wishlistItems?.length || 0;

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleAccordion = (name: string) => {
        setActiveAccordion(activeAccordion === name ? null : name);
    };

    if (!isMobile) {
        return (
            <div
                className={`absolute top-full left-0 w-full bg-white text-black overflow-hidden origin-top transition-all duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] ${isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                    }`}
            >
                <div className="mx-auto max-w-7xl px-6 md:px-10 py-12 md:py-16 overflow-y-auto max-h-[80vh] md:max-h-none">
                    <div className="grid grid-cols-2 gap-y-12 sm:grid-cols-3 md:flex md:flex-wrap md:gap-16 lg:gap-32 w-full">
                        <div className="flex flex-col gap-3">
                            <HoverLink href="/category/abayas" onClick={onClose} className="font-medium text-lg mb-1 !px-3 !py-1">Abayas</HoverLink>
                            <HoverLink href="/category/abayas/embroidered" className="text-sm text-gray-700" onClick={onClose}>Embroidered</HoverLink>
                            <HoverLink href="/category/abayas/coat" className="text-sm text-gray-700" onClick={onClose}>Coat</HoverLink>
                            <HoverLink href="/category/abayas/wedding" className="text-sm text-gray-700" onClick={onClose}>Wedding wear</HoverLink>
                        </div>
                        <div className="flex flex-col gap-3">
                            <HoverLink href="/category/cord-sets" onClick={onClose} className="font-medium text-lg mb-1 !px-3 !py-1">Cord sets</HoverLink>
                            <HoverLink href="/category/cord-sets/embroidered" className="text-sm text-gray-700" onClick={onClose}>Embroidered</HoverLink>
                            <HoverLink href="/category/cord-sets/long" className="text-sm text-gray-700" onClick={onClose}>Long</HoverLink>
                            <HoverLink href="/category/cord-sets/one-piece" className="text-sm text-gray-700" onClick={onClose}>One piece</HoverLink>
                            <HoverLink href="/category/cord-sets/printed" className="text-sm text-gray-700" onClick={onClose}>Printed</HoverLink>
                        </div>
                        <div className="flex flex-col gap-3">
                            <HoverLink href="/category/tops" onClick={onClose} className="font-medium text-lg mb-1 !px-3 !py-1">Tops</HoverLink>
                            <HoverLink href="/category/tops/embroidered" className="text-sm text-gray-700" onClick={onClose}>Embroidered</HoverLink>
                            <HoverLink href="/category/tops/plain" className="text-sm text-gray-700" onClick={onClose}>Plain</HoverLink>
                            <HoverLink href="/category/tops/printed" className="text-sm text-gray-700" onClick={onClose}>Printed</HoverLink>
                        </div>
                        <div className="flex flex-col gap-3">
                            <HoverLink href="/account" className="text-[1.05rem] uppercase font-medium" onClick={onClose}>ACCOUNT</HoverLink>
                        </div>
                        <div className="flex flex-col gap-3">
                            <Link 
                                href="/wishlist" 
                                onClick={onClose}
                                className="group relative flex items-center justify-between w-full pr-4"
                            >
                                <span className="text-[1.05rem] uppercase font-medium">WISH-LIST</span>
                                {wishlistCount > 0 && <span className="text-xs text-gray-400 font-bold">({wishlistCount})</span>}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
                    className="absolute top-full left-0 w-full bg-[#f6f5f3] text-black overflow-hidden z-40 border-t border-gray-100 shadow-2xl"
                >
                    <div className="mx-auto max-w-7xl px-8 py-8 overflow-y-auto max-h-[85vh]">
                        <div className="flex flex-col w-full h-full">
                            <AccordionItem title="Abayas" isOpen={activeAccordion === "Abayas"} onClick={() => toggleAccordion("Abayas")} onClose={onClose}>
                                <Link href="/category/abayas/embroidered" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Embroidered</Link>
                                <Link href="/category/abayas/coat" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Coat</Link>
                                <Link href="/category/abayas/wedding" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Wedding wear</Link>
                            </AccordionItem>
                            <AccordionItem title="Cord sets" isOpen={activeAccordion === "Cord sets"} onClick={() => toggleAccordion("Cord sets")} onClose={onClose}>
                                <Link href="/category/cord-sets/embroidered" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Embroidered</Link>
                                <Link href="/category/cord-sets/long" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Long</Link>
                                <Link href="/category/cord-sets/one-piece" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>One piece</Link>
                                <Link href="/category/cord-sets/printed" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Printed</Link>
                            </AccordionItem>
                            <AccordionItem title="Tops" isOpen={activeAccordion === "Tops"} onClick={() => toggleAccordion("Tops")} onClose={onClose}>
                                <Link href="/category/tops/embroidered" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Embroidered</Link>
                                <Link href="/category/tops/plain" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Plain</Link>
                                <Link href="/category/tops/printed" className="text-sm text-gray-700 px-2 py-1" onClick={onClose}>Printed</Link>
                            </AccordionItem>
                            
                            <div className="py-4 border-b border-gray-100">
                                <HoverLink href="/account" onClick={onClose} className="font-medium text-[1.1rem] uppercase tracking-wider !-ml-3">Account</HoverLink>
                            </div>
                            
                            <div className="py-4 border-b border-gray-100">
                                <Link 
                                    href="/wishlist" 
                                    onClick={onClose} 
                                    className="flex items-center justify-between group px-1"
                                >
                                    <span className="font-medium text-[1.1rem] uppercase tracking-wider">Wish-list</span>
                                    {wishlistCount > 0 && <span className="text-sm text-gray-500 font-bold">({wishlistCount})</span>}
                                </Link>
                            </div>

                            <div className="py-6">
                                <Link 
                                    href="/cart"
                                    onClick={onClose}
                                    className="flex items-center justify-between group"
                                >
                                    <span className="text-[1.1rem] font-medium uppercase tracking-wider">Shopping Bag</span>
                                    <div className="flex items-center gap-3">
                                        {cartCount > 0 && <span className="text-sm text-gray-500 font-bold">({cartCount})</span>}
                                        <ShoppingBag size={22} className="text-black" strokeWidth={1.5} />
                                    </div>
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default MegaMenu;
