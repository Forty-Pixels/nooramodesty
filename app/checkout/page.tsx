"use client";

import React, { useState } from "react";
import useCartStore from "@/store";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronRight, Lock, Truck, CreditCard, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import { Suspense } from "react";

function CheckoutContent() {
    const { items, clearCart, updateQuantity } = useCartStore();
    const searchParams = useSearchParams();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [buyNowQty, setBuyNowQty] = useState(1);

    // Buy Now Logic
    const buyNowId = searchParams.get("buyNowId");
    const buyNowColor = searchParams.get("color");
    const buyNowSize = searchParams.get("size");

    let checkoutItems = items.map(item => {
        // If it's an old item missing size/color, try to find defaults
        if (!item.size || !item.color) {
            const baseId = item._id.split('-')[0];
            const product = products.find(p => p._id === baseId);
            return {
                ...item,
                size: item.size || product?.sizes?.[0] || "",
                color: item.color || product?.colors?.[0] || ""
            };
        }
        return item;
    });

    if (buyNowId) {
        const product = products.find(p => p._id === buyNowId);
        if (product) {
            checkoutItems = [{
                _id: `${product._id}-${buyNowColor}-${buyNowSize}`,
                title: product.title,
                price: product.price,
                image: product.mainImage,
                quantity: buyNowQty,
                color: buyNowColor || product.colors?.[0] || "",
                size: buyNowSize || product.sizes?.[0] || ""
            }];
        }
    }

    const handleUpdateQuantity = (id: string, delta: number) => {
        if (buyNowId) {
            setBuyNowQty(prev => Math.max(1, prev + delta));
        } else {
            const item = items.find(i => i._id === id);
            if (item) {
                updateQuantity(id, Math.max(1, item.quantity + delta));
            }
        }
    };

    const subtotal = checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal > 50000 ? 0 : 1500;
    const total = subtotal + shipping;

    const handlePlaceOrder = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Simulate API call
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
            if (!buyNowId) clearCart();
        }, 2500);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#f6f5f3] flex flex-col items-center justify-center px-6 text-center">
                <div className="max-w-md space-y-8 animate-in fade-in zoom-in duration-1000">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
                        <ShieldCheck size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.2em] text-black">
                        Thank You
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium leading-relaxed">
                        Your order has been placed successfully. You will receive a confirmation email shortly with your order details.
                    </p>
                    <div className="pt-8">
                        <Link
                            href="/category/abayas"
                            className="inline-flex items-center gap-3 bg-black text-white px-10 py-4 text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-zinc-800 transition-all active:scale-95"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (checkoutItems.length === 0) {
        return (
            <div className="min-h-screen bg-[#f6f5f3] flex flex-col items-center justify-center">
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Your bag is empty</p>
                <Link href="/category/abayas" className="text-[10px] font-bold uppercase tracking-[0.3em] underline underline-offset-8">
                    Go Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-[#f6f5f3] min-h-screen font-sans text-black">
            {/* Minimal Header */}
            <header className="py-12 px-6 md:px-12 flex justify-between items-center bg-transparent">
                <Link href="/cart" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity">
                    <ArrowLeft size={14} />
                    Back to Bag
                </Link>
                <div className="w-20 md:flex hidden items-center gap-1 justify-end text-[8px] font-bold text-gray-400">
                    <Lock size={10} />
                    SECURE
                </div>
            </header>

            <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-12 pb-20">
                {/* Left Column: Form */}
                <div className="lg:col-span-7 px-6 md:px-12 py-12 space-y-12 order-2 lg:order-1">
                    {/* Contact Info */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">1</span>
                            <h2 className="text-lg font-bold uppercase tracking-widest">Contact Information</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                required
                            />
                            <div className="flex items-center gap-2 px-1">
                                <input type="checkbox" id="newsletter" className="w-3 h-3 accent-black" />
                                <label htmlFor="newsletter" className="text-[9px] uppercase tracking-wider text-gray-500 font-medium">Keep me updated on news and exclusive offers</label>
                            </div>
                        </div>
                    </section>

                    {/* Shipping Address */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">2</span>
                            <h2 className="text-lg font-bold uppercase tracking-widest">Shipping Address</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="First Name"
                                className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Last Name"
                                className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Address"
                                className="col-span-2 w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Apartment, suite, etc. (optional)"
                                className="col-span-2 w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                            />
                            <input
                                type="text"
                                placeholder="City"
                                className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Phone"
                                className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                required
                            />
                        </div>
                    </section>

                    {/* Shipping Method */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">3</span>
                            <h2 className="text-lg font-bold uppercase tracking-widest">Shipping Method</h2>
                        </div>
                        <div className="border border-black px-6 py-5 bg-white flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <Truck size={18} strokeWidth={1.5} />
                                <div className="space-y-0.5">
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Standard Shipping</p>
                                    <p className="text-[9px] text-gray-400 font-medium tracking-tight">3-5 Business Days</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-bold">LKR {shipping.toLocaleString()}</span>
                        </div>
                    </section>

                    {/* Payment */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">4</span>
                            <h2 className="text-lg font-bold uppercase tracking-widest">Payment</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="p-6 bg-white border border-black/5 space-y-6">
                                <div className="flex items-center justify-between pb-4 border-b border-black/5">
                                    <div className="flex items-center gap-3">
                                        <CreditCard size={18} strokeWidth={1.5} />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Credit Card</span>
                                    </div>
                                    <div className="flex gap-2 opacity-50 grayscale">
                                        <div className="w-8 h-5 bg-gray-200 rounded"></div>
                                        <div className="w-8 h-5 bg-gray-200 rounded"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        placeholder="Card Number"
                                        className="col-span-2 w-full bg-[#fcfcfc] border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Expiry (MM/YY)"
                                        className="w-full bg-[#fcfcfc] border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="CVC"
                                        className="w-full bg-[#fcfcfc] border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={isProcessing}
                        className="w-full bg-black text-white py-6 text-[11px] font-bold uppercase tracking-[0.4em] mt-8 hover:bg-zinc-800 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-black/10 cursor-pointer"
                    >
                        {isProcessing ? "Processing..." : "Complete Purchase"}
                        {!isProcessing && <ArrowRight size={16} />}
                    </button>
                </div>

                {/* Right Column: Order Review */}
                <div className="lg:col-span-5 bg-white px-6 md:px-12 py-12 h-fit lg:sticky lg:top-[88px] order-1 lg:order-2 border-b lg:border-b-0 border-black/5">
                    <h2 className="text-lg font-bold uppercase tracking-widest mb-10">Order Review</h2>
                    
                    <div className="space-y-8 mb-10">
                        {checkoutItems.map((item) => (
                            <div key={item._id} className="flex gap-5">
                                <div className="relative w-20 aspect-[3/4]">
                                    <div className="absolute inset-0 bg-[#f6f5f3] overflow-hidden group">
                                        <Image
                                            src={item.image}
                                            alt={item.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center gap-1">
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-black">
                                        {item.title}
                                    </h3>
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-400">
                                            {item.color && (
                                                <div className="flex items-center gap-1.5">
                                                    <span>Color:</span>
                                                    <div 
                                                        className="w-2 h-2 rounded-full border border-black/5" 
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-gray-400">
                                            {item.size && (
                                                <>
                                                    <span>Size:</span>
                                                    <span className="text-black font-bold">{item.size}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mt-2">
                                        <button 
                                            onClick={() => handleUpdateQuantity(item._id, -1)}
                                            className="w-5 h-5 flex items-center justify-center border border-black/10 rounded-full hover:bg-black hover:text-white transition-all text-[10px] cursor-pointer"
                                        >
                                            -
                                        </button>
                                        <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                                        <button 
                                            onClick={() => handleUpdateQuantity(item._id, 1)}
                                            className="w-5 h-5 flex items-center justify-center border border-black/10 rounded-full hover:bg-black hover:text-white transition-all text-[10px] cursor-pointer"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center text-[10px] font-bold">
                                    LKR {(item.price * item.quantity).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 pt-8 border-t border-black/5">
                        <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-gray-500">
                            <span>Subtotal</span>
                            <span>LKR {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-medium uppercase tracking-widest text-gray-500">
                            <span>Shipping</span>
                            <span>{shipping === 0 ? "FREE" : `LKR ${shipping.toLocaleString()}`}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold uppercase tracking-[0.2em] pt-4 border-t border-black/5">
                            <span>Total</span>
                            <span className="text-black">LKR {total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f6f5f3] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
