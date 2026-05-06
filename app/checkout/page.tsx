"use client";

import React, { useState } from "react";
import useCartStore from "@/store";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ChevronRight, Lock, Truck, CreditCard, ShieldCheck, MessageSquare, Mail, Info } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import { Suspense } from "react";
import { countries } from "@/data/countries";
import { CustomSelect } from "@/components/ui/CustomSelect";

function CheckoutContent() {
    const { items, clearCart, updateQuantity } = useCartStore();
    const searchParams = useSearchParams();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [buyNowQty, setBuyNowQty] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'bank'>('card');
    const [receipt, setReceipt] = useState<File | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string>("");
    const [selectedRegion, setSelectedRegion] = useState<string>("");

    // Buy Now Logic
    const buyNowId = searchParams.get("buyNowId");
    const buyNowColor = searchParams.get("color");
    const buyNowSize = searchParams.get("size");
    const buyNowNote = searchParams.get("customNote");

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
                _id: `${product._id}-${buyNowColor}-${buyNowSize}-${buyNowNote ? encodeURIComponent(buyNowNote) : ""}`,
                title: product.title,
                price: product.salePrice || product.price,
                originalPrice: product.salePrice ? product.price : undefined,
                image: product.mainImage,
                quantity: buyNowQty,
                color: buyNowColor || product.colors?.[0] || "",
                size: buyNowSize || product.sizes?.[0] || "",
                customNote: buyNowNote || undefined
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
    const originalSubtotal = checkoutItems.reduce((acc, item) => acc + (item.originalPrice || item.price) * item.quantity, 0);
    const discountSavings = originalSubtotal - subtotal;
    const shipping = subtotal > 50000 ? 0 : 1500;
    const total = subtotal + shipping;

    const currentCountryData = countries.find(c => c.code === selectedCountry);
    const hasRegions = currentCountryData && currentCountryData.regions && currentCountryData.regions.length > 0;

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
                            
                            <CustomSelect 
                                className="col-span-2"
                                options={countries}
                                placeholder="Country / Region"
                                label="Country / Region"
                                value={selectedCountry}
                                onChange={(val) => {
                                    setSelectedCountry(val);
                                    setSelectedRegion(""); // Reset region when country changes
                                }}
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
                                placeholder="Postal / Zip Code"
                                className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                required
                            />

                            {hasRegions ? (
                                <CustomSelect 
                                    options={currentCountryData.regions}
                                    placeholder={selectedCountry === 'LK' ? "District" : "State / Province"}
                                    label={selectedCountry === 'LK' ? "District" : "State / Province"}
                                    value={selectedRegion}
                                    onChange={(val) => setSelectedRegion(val)}
                                />
                            ) : (
                                <input
                                    type="text"
                                    placeholder="State / Province"
                                    className="w-full bg-white border border-black/5 px-5 py-4 text-xs font-medium focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                                    required
                                />
                            )}
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
                            {/* Payment Method Selector */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <button
                                    onClick={() => setPaymentMethod('card')}
                                    className={`p-6 border flex flex-col items-center gap-3 transition-all duration-300 ${
                                        paymentMethod === 'card' ? "border-black bg-white" : "border-black/5 bg-white/50 hover:bg-white"
                                    }`}
                                >
                                    <CreditCard size={20} strokeWidth={1.5} className={paymentMethod === 'card' ? "text-black" : "text-gray-400"} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${paymentMethod === 'card' ? "text-black" : "text-gray-400"}`}>Credit Card</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('cod')}
                                    className={`p-6 border flex flex-col items-center gap-3 transition-all duration-300 ${
                                        paymentMethod === 'cod' ? "border-black bg-white" : "border-black/5 bg-white/50 hover:bg-white"
                                    }`}
                                >
                                    <Truck size={20} strokeWidth={1.5} className={paymentMethod === 'cod' ? "text-black" : "text-gray-400"} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${paymentMethod === 'cod' ? "text-black" : "text-gray-400"}`}>Cash on Delivery</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('bank')}
                                    className={`p-6 border flex flex-col items-center gap-3 transition-all duration-300 ${
                                        paymentMethod === 'bank' ? "border-black bg-white" : "border-black/5 bg-white/50 hover:bg-white"
                                    }`}
                                >
                                    <ShieldCheck size={20} strokeWidth={1.5} className={paymentMethod === 'bank' ? "text-black" : "text-gray-400"} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${paymentMethod === 'bank' ? "text-black" : "text-gray-400"}`}>Bank Transfer</span>
                                </button>
                            </div>

                            {/* Payment Forms */}
                            <div className="p-8 bg-white border border-black/5 min-h-[200px] flex flex-col justify-center">
                                {paymentMethod === 'card' && (
                                    <div className="space-y-8 animate-in fade-in duration-500">
                                        <div className="flex items-center justify-between pb-4 border-b border-black/5">
                                            <div className="flex items-center gap-3">
                                                <CreditCard size={18} strokeWidth={1.5} />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Credit Card Details</span>
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
                                )}

                                {paymentMethod === 'cod' && (
                                    <div className="space-y-4 text-center py-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <Truck size={32} strokeWidth={1} className="mx-auto text-gray-300" />
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-black">Pay upon delivery</p>
                                            <p className="text-[9px] text-gray-500 uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                                                Please have the exact amount ready for our courier partner. We accept cash only for this method.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'bank' && (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <div className="bg-[#fcfcfc] p-6 border border-black/5 space-y-4">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Transfer Details</p>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] uppercase tracking-widest text-gray-400">Bank Name</p>
                                                    <p className="text-[10px] font-bold">Example Bank</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] uppercase tracking-widest text-gray-400">Account Number</p>
                                                    <p className="text-[10px] font-bold tracking-widest">0000 0000 0000</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] uppercase tracking-widest text-gray-400">Branch</p>
                                                    <p className="text-[10px] font-bold">Example Branch</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] uppercase tracking-widest text-gray-400">Account Name</p>
                                                    <p className="text-[10px] font-bold">Example Account Name</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Upload Receipt</p>
                                            <div className="relative border-2 border-dashed border-black/5 hover:border-black/10 transition-colors p-8 text-center cursor-pointer group">
                                                <input 
                                                    type="file" 
                                                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/*"
                                                />
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest group-hover:text-black transition-colors">
                                                        {receipt ? receipt.name : "Select Image"}
                                                    </p>
                                                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">
                                                        JPEG or PNG (Max 5MB)
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-[8px] text-gray-400 uppercase tracking-widest leading-relaxed text-center italic">
                                                * Please upload your transfer slip to avoid processing delays.
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                        {item.customNote && (
                                            <p className="text-[8px] leading-relaxed text-[#8B8378] font-bold">
                                                {item.customNote}
                                            </p>
                                        )}
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
                                <div className="flex flex-col items-end gap-1">
                                    <div className="text-[10px] font-bold">
                                        LKR {(item.price * item.quantity).toLocaleString()}
                                    </div>
                                    {item.originalPrice && (
                                        <div className="text-[8px] text-gray-400 line-through font-medium">
                                            LKR {(item.originalPrice * item.quantity).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    {/* Promo Code Section */}
                    <div className="mb-10 pb-10 border-b border-black/5">
                        <label className="text-[9px] uppercase tracking-[0.2em] font-bold text-gray-400 block mb-4">
                            Promo Code / Gift Card
                        </label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="ENTER CODE"
                                className="flex-1 bg-[#fcfcfc] border border-black/5 px-4 py-3 text-[10px] font-bold tracking-[0.1em] text-black focus:outline-none focus:border-black/20 transition-all placeholder:text-gray-300"
                            />
                            <button className="bg-black text-white px-5 py-3 text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-colors whitespace-nowrap">
                                Apply
                            </button>
                        </div>
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
                        {discountSavings > 0 && (
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[#B21E1E]">
                                <span>Discount</span>
                                <span>- LKR {discountSavings.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-base font-bold uppercase tracking-[0.2em] pt-4 border-t border-black/5">
                            <span>Total</span>
                            <span className="text-black">LKR {total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Support & Assistance */}
                    <div className="mt-12 pt-8 border-t border-black/5 space-y-6">
                        <div className="space-y-4">
                            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-black">Need Assistance?</p>
                            <div className="space-y-3">
                                <a 
                                    href="https://wa.me/94771234567" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 text-[10px] text-gray-500 hover:text-black transition-colors group"
                                >
                                    <svg 
                                        viewBox="0 0 24 24" 
                                        className="w-3.5 h-3.5 fill-gray-400 group-hover:fill-black transition-colors"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                    </svg>
                                    <span className="font-medium tracking-[0.2em] uppercase">WhatsApp Support</span>
                                </a>
                                <a 
                                    href="mailto:hello@nooramodesty.com" 
                                    className="flex items-center gap-3 text-[10px] text-gray-500 hover:text-black transition-colors group"
                                >
                                    <Mail size={14} strokeWidth={1.5} className="text-gray-400 group-hover:text-black transition-colors" />
                                    <span className="font-medium tracking-wider">HELLO@NOORAMODESTY.COM</span>
                                </a>
                            </div>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-x-6 gap-y-2">
                            <Link href="/shipping-and-return-policy" className="text-[8px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-1.5">
                                <Info size={10} />
                                Shipping & Returns
                            </Link>
                            <Link href="/privacy-policy" className="text-[8px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">
                                Privacy Policy
                            </Link>
                        </div>
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
