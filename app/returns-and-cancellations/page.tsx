"use client";

import React, { useState } from "react";
import { ShieldCheck, ArrowRight, ChevronDown, Check } from "lucide-react";
import Link from "next/link";

const REASONS = {
    cancellation: [
        "Changed my mind",
        "Found a better price elsewhere",
        "Order placed by mistake",
        "Delivery time is too long",
        "Other"
    ],
    return: [
        "Size doesn't fit",
        "Received wrong item",
        "Item is damaged or defective",
        "Product looks different from photos",
        "Quality not as expected",
        "Other"
    ]
};

export default function ReturnsAndCancellationsPage() {
    const [requestType, setRequestType] = useState<"return" | "cancellation">("return");
    const [reason, setReason] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        // Simulate submission
        setTimeout(() => {
            setIsProcessing(false);
            setIsSubmitted(true);
        }, 2000);
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
                <div className="max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                        <Check size={40} className="text-white" />
                    </div>
                    <div className="space-y-4">
                        <h1 className="text-3xl font-bold uppercase tracking-[0.2em] text-black">
                            Request Sent
                        </h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold leading-relaxed">
                            Your request has been received. Our team will review the details and contact you within 24-48 hours.
                        </p>
                    </div>
                    <div className="pt-8">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-3 bg-black text-white px-12 py-4 text-[10px] tracking-[0.4em] font-bold uppercase hover:bg-zinc-800 transition-all active:scale-95"
                        >
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#f6f5f3] pt-32 pb-20 px-6">
            <div className="max-w-2xl mx-auto bg-white p-8 md:p-16 shadow-sm">
                <div className="mb-12 text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-[0.25em] text-black mb-4">
                        Returns & <br className="md:hidden" /> Cancellations
                    </h1>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">
                        Please fill out the form below to submit your request
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-10">
                    {/* Request Type Toggle */}
                    <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Request Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            {(["return", "cancellation"] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => {
                                        setRequestType(type);
                                        setReason("");
                                    }}
                                    className={`py-4 text-[10px] font-bold uppercase tracking-[0.2em] border transition-all ${
                                        requestType === type 
                                            ? "bg-black text-white border-black" 
                                            : "bg-white text-gray-600 border-black/10 hover:border-black/30"
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Full Name</label>
                            <input 
                                required
                                type="text" 
                                className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
                            />
                        </div>

                        {/* Order Number */}
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Order Number</label>
                            <input 
                                required
                                type="text" 
                                placeholder="e.g. #NM20261234"
                                className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Phone Number</label>
                        <input 
                            required
                            type="tel" 
                            placeholder="e.g. +94 77 123 4567"
                            className="w-full bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-black placeholder:text-gray-400"
                        />
                    </div>

                    {/* Reason Select */}
                    <div className="space-y-2 relative">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Reason</label>
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full flex items-center justify-between bg-transparent border-b border-black/20 focus:border-black outline-none py-2 text-sm transition-colors text-left"
                        >
                            <span className={reason ? "text-black" : "text-gray-500"}>
                                {reason || `Select a reason for ${requestType}`}
                            </span>
                            <ChevronDown size={14} className={`text-gray-600 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-black/10 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="max-h-60 overflow-y-auto">
                                    {REASONS[requestType].map((opt) => (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() => {
                                                setReason(opt);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-[#f6f5f3] hover:text-black transition-colors"
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Additional Details</label>
                        <textarea 
                            rows={4}
                            className="w-full bg-transparent border border-black/10 focus:border-black outline-none p-4 text-sm transition-colors resize-none text-black placeholder:text-gray-400"
                            placeholder="Please provide any extra information here..."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                        <button
                            disabled={isProcessing}
                            className={`w-full bg-black text-white py-6 text-[10px] tracking-[0.5em] font-bold uppercase transition-all flex items-center justify-center gap-4 ${
                                isProcessing ? "opacity-70 cursor-not-allowed" : "hover:bg-zinc-800 active:scale-[0.98]"
                            }`}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    Submit Request
                                    <ArrowRight size={14} />
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
