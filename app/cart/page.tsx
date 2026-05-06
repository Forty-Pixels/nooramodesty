"use client";

import React from "react";
import useCartStore from "@/store";
import Link from "next/link";
import Image from "next/image";
import { Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { siteLinks } from "@/data/siteLinks";

export default function CartPage() {
    const { items, removeItem, updateQuantity } = useCartStore();

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const originalSubtotal = items.reduce((acc, item) => acc + (item.originalPrice || item.price) * item.quantity, 0);
    const discount = originalSubtotal - subtotal;
    const shipping = subtotal > 0 ? 500 : 0;
    const total = subtotal + shipping;

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
                        href="/category/abayas"
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
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 md:py-20">
                <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.3em] text-black mb-12 md:mb-16">
                    Shopping Bag <span className="text-gray-400 font-medium ml-2">({items.length})</span>
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 xl:gap-20 items-start">
                    {/* Left: Items List */}
                    <div className="lg:col-span-8 space-y-8">
                        {items.map((item) => (
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
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                        </div>
                                                    )}
                                                    {item.size && (
                                                        <div className="flex items-center gap-2">
                                                            <span>Size:</span>
                                                            <span className="text-black font-bold">{item.size}</span>
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
                                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors"
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
                                </div>
                            </div>
                        ))}
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

                            {/* Promo Code Section */}
                            <div className="pt-2 space-y-4">
                                <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400">
                                    Promotional Code / Gift Card
                                </label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        placeholder="ENTER CODE"
                                        className="flex-1 bg-[#fcfcfc] border border-black/5 px-4 py-3 text-[10px] font-bold tracking-[0.1em] text-black focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                    />
                                    <button className="bg-black text-white px-6 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors whitespace-nowrap">
                                        Apply
                                    </button>
                                </div>
                            </div>

                        <Link 
                            href="/checkout"
                            className="w-full bg-[#8B8378] hover:bg-[#7a7166] text-white py-4 text-[10px] font-bold uppercase tracking-[0.4em] transition-all active:scale-[0.98] flex items-center justify-center"
                        >
                            Proceed to Checkout
                        </Link>

                            <div className="pt-4 space-y-4">
                                <p className="text-[9px] text-gray-400 uppercase tracking-widest leading-relaxed text-center">
                                    Complimentary delivery on orders above LKR 50,000. 
                                    Secure checkout guaranteed.
                                </p>
                            </div>
                        </div>

                        {/* Additional Info links */}
                        <div className="mt-8 flex flex-col gap-3 px-4">
                            {siteLinks.support.map((link) => (
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
