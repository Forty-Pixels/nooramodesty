"use client";

import React, { useState } from "react";
import { Search, MapPin, Phone } from "lucide-react";
import { isStoreLocatorActive } from "@/utils/featureFlags";
import { notFound } from "next/navigation";

interface Store {
    id: string;
    name: string;
    city: string;
    address: string;
    phone: string;
    hours: string;
    amenities: string[];
    isFlagship: boolean;
}

// Keeping database empty since there are no physical stores yet
const STORES: Store[] = [];

export default function StoreLocatorPage() {
    if (!isStoreLocatorActive) {
        notFound();
    }

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCity, setSelectedCity] = useState("All");

    const cities = ["All", "Colombo", "Galle", "Kandy", "Negombo"];

    const filteredStores = STORES.filter((store) => {
        const matchesSearch = 
            store.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            store.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            store.city.toLowerCase().includes(searchQuery.toLowerCase());
            
        const matchesCity = selectedCity === "All" || store.city === selectedCity;

        return matchesSearch && matchesCity;
    });

    return (
        <main className="min-h-screen bg-[#f6f5f3] pt-24 md:pt-32 pb-20 px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="mb-12 text-center">
                    <h1 className="text-2xl md:text-4xl font-bold uppercase tracking-[0.15em] md:tracking-[0.25em] text-black mb-4 leading-tight">
                        Store Locator
                    </h1>
                    <p className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold max-w-xl mx-auto leading-relaxed">
                        Find a Noora Modesty retail experience near you. Search by area or explore our upcoming store network.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left side: Search & Store Cards (5 columns) */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* Search & Filters */}
                        <div className="bg-white p-6 shadow-sm border border-black/5 space-y-5">
                            <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold">Find a Store Near You</h2>
                            
                            {/* Search bar */}
                            <div className="relative flex items-center border-b border-black/10 focus-within:border-black transition-colors py-1.5">
                                <Search size={16} className="text-gray-400 mr-3 flex-shrink-0" />
                                <input 
                                    type="text"
                                    placeholder="SEARCH BY CITY OR ADDRESS..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent outline-none text-xs font-medium uppercase tracking-[0.1em] text-black placeholder:text-gray-300"
                                />
                            </div>

                            {/* Popular Area Toggles */}
                            <div className="space-y-2">
                                <label className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Search by Area</label>
                                <div className="flex flex-wrap gap-2">
                                    {cities.map((city) => (
                                        <button
                                            key={city}
                                            type="button"
                                            onClick={() => setSelectedCity(city)}
                                            className={`px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest border transition-all ${
                                                selectedCity === city
                                                    ? "bg-black text-white border-black"
                                                    : "bg-white text-gray-500 border-black/5 hover:border-black/20"
                                            }`}
                                        >
                                            {city}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stores List */}
                        <div className="space-y-4">
                            {filteredStores.length > 0 ? (
                                filteredStores.map((store) => (
                                    <div 
                                        key={store.id} 
                                        className="bg-white p-6 shadow-sm border border-black/5 hover:border-black/10 transition-all space-y-5"
                                    >
                                        <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-black">
                                            {store.name}
                                        </h3>

                                        <div className="space-y-3.5 text-xs text-gray-600 font-medium">
                                            <div className="flex items-start gap-3">
                                                <MapPin size={14} className="text-black flex-shrink-0 mt-0.5" />
                                                <p className="leading-relaxed text-[11px] font-medium">{store.address}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Phone size={14} className="text-black flex-shrink-0" />
                                                <a href={`tel:${store.phone.replace(/\s+/g, "")}`} className="text-[11px] font-medium hover:text-black transition-colors">{store.phone}</a>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white p-8 shadow-sm border border-black/5 text-center space-y-4">
                                    <div className="w-10 h-10 bg-[#f6f5f3] rounded-full flex items-center justify-center mx-auto text-black/40">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-black">
                                            Locations Will Be Added Soon
                                        </h3>
                                        <p className="text-[9px] uppercase tracking-wider text-gray-400 leading-relaxed max-w-xs mx-auto">
                                            We are currently planning our future retail boutiques. Store locations and custom experience centers will be added to this map soon.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side: Real Google Maps Embed with Premium Styling (7 columns) */}
                    <div className="lg:col-span-7 h-[400px] lg:h-[620px] bg-white shadow-sm border border-black/5 relative overflow-hidden flex flex-col justify-between p-6">
                        
                        {/* Real Map iframe */}
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15843.469733470716!2d79.84333671755106!3d6.906474660995166!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae25963120b1509%3A0x2db2c198068c9cf4!2sColombo%2003%2C%20Colombo!5e0!3m2!1sen!2slk!4v1716300000000!5m2!1sen!2slk"
                            className="absolute inset-0 w-full h-full border-0"
                            allowFullScreen={false}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Noora Modesty Map"
                        />

                    </div>

                </div>

            </div>
        </main>
    );
}
