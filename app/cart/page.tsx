"use client";

import React from "react";
import { useEffect, useState } from "react";
import useCartStore from "@/store";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight, X } from "lucide-react";
import { siteLinks } from "@/data/siteLinks";
import { calculateShippingQuote, DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from "@/lib/shipping";
import { PublicSiteSettings } from "@/types/siteSettings";
import { isStoreLocatorActive } from "@/utils/featureFlags";
import { useVariationStockState } from "@/lib/client/productStock";
import { StockHintSkeleton } from "@/components/ui/StockHintSkeleton";

function formatCartItemSize(item: { size?: string; customSize?: boolean; customNote?: string }) {
    return item.customSize && item.customNote ? item.customNote : item.size;
}

interface ColorPreviewModalState {
    src: string;
    alt: string;
}

export default function CartPage() {
    const { items, removeItem, updateQuantity } = useCartStore();
    const [siteSettings, setSiteSettings] = useState<PublicSiteSettings>(DEFAULT_SITE_SETTINGS);
    const [previewImage, setPreviewImage] = useState<ColorPreviewModalState | null>(null);
    const { stockByVariationId, isLoadingStock } = useVariationStockState(
        items
            .map((item) => item.clickomVariationId)
            .filter((id): id is number => Number.isFinite(id) && Number(id) > 0),
    );

    useEffect(() => {
        items.forEach((item) => {
            if (!item.clickomVariationId || item.preOrder || item.customSize) return;
            const stock = stockByVariationId[item.clickomVariationId];
            if (typeof stock !== "number") return;
            const maxOrderableQuantity = Math.max(1, Math.min(20, stock));
            if (item.quantity > maxOrderableQuantity) {
                updateQuantity(item._id, maxOrderableQuantity);
            }
        });
    }, [items, stockByVariationId, updateQuantity]);

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const originalSubtotal = items.reduce((acc, item) => acc + (item.originalPrice || item.price) * item.quantity, 0);
    const discount = originalSubtotal - subtotal;
    const itemQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    const shippingQuote = calculateShippingQuote(itemQuantity, siteSettings);
    const shipping = shippingQuote.shipping;
    const total = subtotal + shipping;

    useEffect(() => {
        let isMounted = true;

        async function loadSiteSettings() {
            const response = await fetch("/api/site-settings", { cache: "no-store" });
            const data = (await response.json().catch(() => null)) as Partial<PublicSiteSettings> | null;
            if (isMounted && response.ok) {
                setSiteSettings(normalizeSiteSettings(data));
            }
        }

        void loadSiteSettings();

        return () => {
            isMounted = false;
        };
    }, []);

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center bg-[#f6f5f3]">
                <div className="space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <h1 className="text-4xl md:text-5xl font-bold uppercase tracking-[0.2em] text-black">
                        Your Bag
                    </h1>
                    <p className="text-gray-500 uppercase text-[10px] tracking-[0.3em] font-medium leading-relaxed">
                        It looks like your shopping bag is empty. Explore our latest collections to find your perfect fit.
                    </p>
                    <Link
                        href="/"
                        className="group inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-zinc-800 transition-all active:scale-95"
                    >
                        Explore Collections
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#f6f5f3] min-h-screen">
            {previewImage && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-6 py-10" onClick={() => setPreviewImage(null)}>
                    <div className="relative w-full max-w-sm bg-white p-3 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setPreviewImage(null)}
                            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center bg-white text-black shadow-sm transition-colors hover:bg-[#f6f5f3]"
                            aria-label="Close color preview"
                        >
                            <X size={16} strokeWidth={1.5} />
                        </button>
                        <div className="relative aspect-[3/4] w-full bg-[#f6f5f3]">
                            <Image src={previewImage.src} alt={previewImage.alt} fill className="object-cover" sizes="(max-width: 640px) 90vw, 384px" />
                        </div>
                    </div>
                </div>
            )}
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 md:py-20">
                <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.3em] text-black mb-12 md:mb-16">
                    Shopping Bag <span className="text-gray-400 font-medium ml-2">({items.length})</span>
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">
                    {/* Left: Items List */}
                    <div className="lg:col-span-8 space-y-8">
                        {items.map((item) => {
                        const availableStock = item.clickomVariationId ? stockByVariationId[item.clickomVariationId] : undefined;
                        const hasKnownStockLimit = !item.preOrder && !item.customSize && typeof availableStock === "number";
                        const maxOrderableQuantity = hasKnownStockLimit ? Math.max(1, Math.min(20, availableStock as number)) : 20;
                        // Until this item's stock lands, we have no real ceiling to enforce — hold
                        // the stepper rather than let it climb to the cap and snap back afterwards.
                        const isStockPending =
                            isLoadingStock &&
                            !item.preOrder &&
                            !item.customSize &&
                            Boolean(item.clickomVariationId) &&
                            typeof availableStock !== "number";
                        return (
                            <div
                                key={item._id}
                                className="flex gap-6 md:gap-10 pb-8 border-b border-black/5 animate-in fade-in duration-700"
                            >
                                {/* Thumbnail */}
                                <Link 
                                    href={`/product/${item.slug}`}
                                    className="relative w-32 h-44 md:w-44 md:h-60 bg-white overflow-hidden flex-shrink-0 group"
                                >
                                    <Image
                                        src={item.image}
                                        alt={item.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </Link>

                                {/* Details */}
                                <div className="flex flex-col justify-between flex-grow py-1">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-black mb-1">
                                                    {item.title}
                                                </h3>
                                                <div className="flex flex-col gap-1 text-[10px] uppercase tracking-widest font-medium text-gray-400">
                                                    {item.color && (
                                                        <div className="flex items-center gap-2">
                                                            <span>Color:</span>
                                                            <div
                                                                className="w-2.5 h-2.5 rounded-full border border-black/10"
                                                                style={{ backgroundColor: item.colorHex || item.color }}
                                                            />
                                                            {item.colorPreviewImage && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (!item.colorPreviewImage) return;
                                                                        setPreviewImage({
                                                                            src: item.colorPreviewImage,
                                                                            alt: `${item.colorName || item.title} color preview`,
                                                                        });
                                                                    }}
                                                                    className="group relative h-10 w-8 overflow-hidden border border-black/10 bg-white transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black/20"
                                                                    aria-label={`Open ${item.colorName || item.title} color preview`}
                                                                >
                                                                    <Image src={item.colorPreviewImage} alt="" fill className="object-cover transition-transform duration-300 group-hover:scale-110" sizes="32px" />
                                                                </button>
                                                            )}
                                                            {item.colorName && <span className="text-black font-bold">{item.colorName}</span>}
                                                        </div>
                                                    )}
                                                    {item.size && (
                                                        <div className="flex items-center gap-2">
                                                            <span>Size:</span>
                                                            <span className="text-black font-bold">
                                                                {formatCartItemSize(item)} {item.customSize && `(+ LKR ${siteSettings.customSizeCharge.toLocaleString()})`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {item.customNote && (
                                                        <p className="text-[9px] leading-relaxed text-[#8B8378] font-bold mt-1">
                                                            {item.customNote}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeItem(item._id)}
                                                className="text-gray-400 hover:text-black transition-colors p-1"
                                                aria-label="Remove item"
                                            >
                                                <Trash2 size={18} strokeWidth={1.5} />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <p className="text-sm font-bold text-black tracking-wider">
                                                LKR {item.price.toLocaleString()}
                                            </p>
                                            {item.originalPrice && (
                                                <p className="text-xs text-gray-400 line-through font-medium">
                                                    LKR {item.originalPrice.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-6 mt-4">
                                        <div className="flex items-center border border-black/10 bg-white text-black">
                                            <button 
                                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={14} className="text-black" />
                                            </button>
                                            <span className="w-10 text-center text-xs font-bold font-sans text-black">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item._id, Math.min(maxOrderableQuantity, item.quantity + 1))}
                                                disabled={isStockPending || item.quantity >= maxOrderableQuantity}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
                                            >
                                                <Plus size={14} className="text-black" />
                                            </button>
                                        </div>

                                        <div className="hidden md:block">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">
                                                Subtotal: <span className="text-black ml-2">LKR {(item.price * item.quantity).toLocaleString()}</span>
                                            </p>
                                        </div>
                                    </div>
                                    {isStockPending && <StockHintSkeleton />}
                                    {hasKnownStockLimit && (availableStock as number) < 20 && (
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700/80">
                                            Only {Math.max(0, availableStock as number)} in stock
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>

                    {/* Right: Summary */}
                    <div className="lg:col-span-4 lg:sticky lg:top-32">
                        <div className="bg-white p-8 md:p-10 shadow-sm border border-black/5 space-y-8">
                            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-black border-b border-black/5 pb-4">
                                Order Summary
                            </h2>

                            <div className="space-y-4">
                                <div className="flex justify-between text-[11px] uppercase tracking-widest font-medium text-gray-500">
                                    <span>Subtotal</span>
                                    <span className="text-black">LKR {subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[11px] uppercase tracking-widest font-medium text-gray-500">
                                    <span>Estimated Shipping</span>
                                    <span className="text-black">LKR {shipping.toLocaleString()}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-[11px] uppercase tracking-widest font-bold text-[#B21E1E]">
                                        <span>Discount</span>
                                        <span>- LKR {discount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-4 border-t border-black/5 flex justify-between text-sm uppercase tracking-[0.2em] font-bold text-black">
                                    <span>Total</span>
                                    <span>LKR {total.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Promo Code Note */}
                            <div className="pt-2">
                                <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 text-center">
                                    Have a coupon or gift card? Apply it at checkout.
                                </p>
                            </div>

                        <Link 
                            href="/checkout"
                            className="w-full bg-[#8B8378] hover:bg-[#7a7166] text-white py-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all active:scale-[0.98] flex items-center justify-center"
                        >
                            Proceed to Checkout
                        </Link>

                            <div className="pt-4 space-y-4">
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-relaxed text-center">
                                    Final delivery charge is calculated from item weight.
                                    Secure checkout guaranteed.
                                </p>
                            </div>
                        </div>

                        {/* Additional Info links */}
                        <div className="mt-8 flex flex-col gap-3 px-4">
                            {siteLinks.support
                                .filter((link) => link.href !== "/store-locator" || isStoreLocatorActive)
                                .map((link) => (
                                    link.isExternal ? (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[9px] uppercase tracking-widest font-bold text-gray-400 hover:text-black transition-colors"
                                        >
                                            {link.label}
                                        </a>
                                    ) : (
                                        <Link key={link.label} href={link.href} className="text-[9px] uppercase tracking-widest font-bold text-gray-400 hover:text-black transition-colors">
                                            {link.label}
                                        </Link>
                                    )
                                ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
