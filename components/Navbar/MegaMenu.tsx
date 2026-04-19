"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import useCartStore from "@/store";

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

const AccordionItem = ({ title, children, isOpen, onClick }: { title: string, children: React.ReactNode, isOpen: boolean, onClick: () => void }) => (
    <div className="border-b border-gray-100 last:border-0 grow">
        <button
            onClick={onClick}
            className="flex items-center justify-between w-full py-4 text-left"
        >
            <h3 className="font-medium text-[1.1rem] uppercase tracking-wider">{title}</h3>
            <div>
                {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
            </div>
        </button>
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

const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen }) => {
    const [activeAccordion, setActiveAccordion] = useState<string | null>("Abayas");
    const [isMobile, setIsMobile] = useState(false);
    const { items } = useCartStore();
    const cartCount = items?.length || 0;

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
                            <h3 className="font-medium text-lg mb-1">Abayas</h3>
                            <HoverLink href="/category/abayas/embroidered" className="text-sm text-gray-700">Embroidered</HoverLink>
                            <HoverLink href="/category/abayas/coat" className="text-sm text-gray-700">Coat</HoverLink>
                            <HoverLink href="/category/abayas/wedding" className="text-sm text-gray-700">Wedding wear</HoverLink>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h3 className="font-medium text-lg mb-1">Cord sets</h3>
                            <HoverLink href="/category/cord-sets/embroidered" className="text-sm text-gray-700">Embroidered</HoverLink>
                            <HoverLink href="/category/cord-sets/long" className="text-sm text-gray-700">Long</HoverLink>
                            <HoverLink href="/category/cord-sets/one-piece" className="text-sm text-gray-700">One piece</HoverLink>
                            <HoverLink href="/category/cord-sets/printed" className="text-sm text-gray-700">Printed</HoverLink>
                        </div>
                        <div className="flex flex-col gap-3">
                            <h3 className="font-medium text-lg mb-1">Tops</h3>
                            <HoverLink href="/category/tops/embroidered" className="text-sm text-gray-700">Embroidered</HoverLink>
                            <HoverLink href="/category/tops/plain" className="text-sm text-gray-700">Plain</HoverLink>
                            <HoverLink href="/category/tops/printed" className="text-sm text-gray-700">Printed</HoverLink>
                        </div>
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
                            <AccordionItem title="Abayas" isOpen={activeAccordion === "Abayas"} onClick={() => toggleAccordion("Abayas")}>
                                <Link href="/category/abayas/embroidered" className="text-sm text-gray-700 px-2 py-1">Embroidered</Link>
                                <Link href="/category/abayas/coat" className="text-sm text-gray-700 px-2 py-1">Coat</Link>
                                <Link href="/category/abayas/wedding" className="text-sm text-gray-700 px-2 py-1">Wedding wear</Link>
                            </AccordionItem>
                            <AccordionItem title="Cord sets" isOpen={activeAccordion === "Cord sets"} onClick={() => toggleAccordion("Cord sets")}>
                                <Link href="/category/cord-sets/embroidered" className="text-sm text-gray-700 px-2 py-1">Embroidered</Link>
                                <Link href="/category/cord-sets/long" className="text-sm text-gray-700 px-2 py-1">Long</Link>
                                <Link href="/category/cord-sets/one-piece" className="text-sm text-gray-700 px-2 py-1">One piece</Link>
                                <Link href="/category/cord-sets/printed" className="text-sm text-gray-700 px-2 py-1">Printed</Link>
                            </AccordionItem>
                            <AccordionItem title="Tops" isOpen={activeAccordion === "Tops"} onClick={() => toggleAccordion("Tops")}>
                                <Link href="/category/tops/embroidered" className="text-sm text-gray-700 px-2 py-1">Embroidered</Link>
                                <Link href="/category/tops/plain" className="text-sm text-gray-700 px-2 py-1">Plain</Link>
                                <Link href="/category/tops/printed" className="text-sm text-gray-700 px-2 py-1">Printed</Link>
                            </AccordionItem>
                            
                            <div className="py-4 border-b border-gray-100">
                                <Link href="/account" className="font-medium text-[1.1rem] uppercase tracking-wider block">Account</Link>
                            </div>
                            
                            <div className="py-4 border-b border-gray-100">
                                <Link href="/wishlist" className="font-medium text-[1.1rem] uppercase tracking-wider block">Wish-list</Link>
                            </div>

                            <div className="py-6">
                                <Link 
                                    href="/cart"
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
