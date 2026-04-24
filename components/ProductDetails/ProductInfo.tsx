"use client";

import { Product } from "@/types/product";
import { useState } from "react";
import Image from "next/image";
import useCartStore from "@/store";
import { Heart, Send } from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductInfoProps {
    product: Product;
}

export const ProductInfo = ({ product }: ProductInfoProps) => {
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0]);
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[0]);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [isAdded, setIsAdded] = useState(false);
    
    const { addItem, toggleWishlist, wishlistItems } = useCartStore();
    const isWishlisted = wishlistItems.some(item => item._id === product._id);
    const router = useRouter();

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    const handleAddToBag = () => {
        addItem({
            _id: `${product._id}-${selectedColor}-${selectedSize}`,
            title: product.title,
            price: product.price,
            image: product.mainImage,
            quantity: 1,
            color: selectedColor,
            size: selectedSize
        });
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    const handleToggleWishlist = () => {
        toggleWishlist({
            _id: product._id,
            title: product.title,
            price: product.price,
            image: product.mainImage,
            slug: product.slug,
        });
    };

    const handleBuyNow = () => {
        router.push(`/checkout?buyNowId=${product._id}&color=${encodeURIComponent(selectedColor || "")}&size=${encodeURIComponent(selectedSize || "")}`);
    };

    return (
        <div className="flex flex-col gap-3 text-[#1A1A1A] font-sans h-full">
            {/* Header */}
            <div className="space-y-1">
                <div className="flex justify-between items-start">
                    <h1 className="text-xl font-bold tracking-wider uppercase">
                        {product.title}
                    </h1>
                    <button 
                        onClick={handleToggleWishlist}
                        className="p-2 -mt-1 group transition-colors"
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                    >
                        <Heart 
                            size={22} 
                            className={`transition-all duration-300 ${isWishlisted ? "fill-[#8B8378] text-[#8B8378]" : "text-black hover:scale-110"}`} 
                            strokeWidth={1.5}
                        />
                    </button>
                </div>
                <p className="text-lg font-bold">
                    LKR {product.price.toLocaleString()}
                </p>
                <div className="w-28 h-[1px] bg-gray-200 mt-2" />
            </div>

            {/* Collection Info */}
            <div className="mt-1 space-y-2">
                <h2 className="text-[11px] font-bold uppercase tracking-wider">Woman Collection</h2>
                
                <div className="space-y-0.5">
                    <p className="text-[10px] text-black tracking-wide font-bold">
                        Type: <span className="text-gray-400 font-normal">{product.type}</span>
                    </p>
                    <p className="text-[10px] text-black tracking-wide font-bold">
                        Color: <span className="text-gray-400 font-normal">{product.color}</span>
                    </p>
                    <p className="text-[10px] text-black tracking-wide font-bold">
                        Collection: <span className="text-gray-400 font-normal">{product.collection}</span>
                    </p>
                </div>
            </div>

            {/* Description */}
            <div className="mt-1">
                <p className="text-[10px] leading-relaxed text-black max-w-sm">
                    {product.description}
                </p>
            </div>

            {/* Selectors (Aligned with Buttons) */}
            <div className="flex gap-4 mt-2">
                {/* Color Selector */}
                <div className="w-44 space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Color</label>
                    <div className="flex gap-2">
                        {product.colors?.map((c) => (
                            <button
                                key={c}
                                onClick={() => setSelectedColor(c)}
                                className={`w-7 h-7 rounded-full border border-gray-200 transition-all duration-300 ${
                                    selectedColor === c ? "ring-2 ring-[#8B8378] ring-offset-2" : "hover:scale-110"
                                }`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* Size Selector */}
                <div className="w-44 space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Size</label>
                    <div className="flex gap-2">
                        {product.sizes?.map((s) => (
                            <button
                                key={s}
                                onClick={() => setSelectedSize(s)}
                                className={`w-7 h-7 flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                                    selectedSize === s 
                                    ? "bg-[#8B8378] text-white border-[#8B8378]" 
                                    : "bg-white text-black border-gray-200 hover:border-[#8B8378]"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center gap-4">
                <button 
                    onClick={handleBuyNow}
                    className="w-44 h-11 bg-[#8B8378] hover:bg-[#7a7166] text-white text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer"
                >
                    Buy Now
                </button>
                <button 
                    onClick={handleAddToBag}
                    className="w-44 h-11 bg-white border border-[#8B8378] text-[#8B8378] hover:bg-gray-50 text-[11px] font-bold uppercase tracking-widest transition-all relative overflow-hidden cursor-pointer"
                >
                    <span className={`absolute inset-0 flex items-center justify-center bg-[#8B8378] text-white transition-transform duration-300 ${isAdded ? "translate-y-0" : "translate-y-full"}`}>
                        ADDED TO BAG
                    </span>
                    <span className={`${isAdded ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}>
                        Add to Bag
                    </span>
                </button>
                <button className="w-11 h-11 border border-gray-300 hover:border-black transition-all flex items-center justify-center group cursor-pointer">
                    <svg 
                        viewBox="0 0 24 24" 
                        className="w-7 h-7 fill-[#25D366] transition-colors"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.032c0 2.12.549 4.188 1.59 6.007L0 24l6.135-1.61c1.747.953 3.71 1.456 5.71 1.458h.005c6.635 0 12.031-5.396 12.033-12.033.001-3.216-1.251-6.241-3.526-8.517z"/>
                    </svg>
                </button>
            </div>

            {/* Consolidated Material Quality Detail Section */}
            {product.materialSpecs && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-black">Material Quality Detail</span>
                    </div>
                    
                    <div className="flex gap-5 items-start bg-gray-50/50 p-3.5 rounded-sm border border-gray-50">
                        {/* Macro Image Thumbnail */}
                        <div className="relative w-16 h-16 bg-white border border-gray-100 flex-shrink-0">
                            <Image
                                src={product.materialSpecs.macroImage}
                                alt="Fabric Macro"
                                fill
                                className="object-cover"
                            />
                        </div>

                        {/* Specs Grid */}
                        <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-2">
                            <div className="space-y-0.5">
                                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Fabric Type</p>
                                <p className="text-[11px] font-bold text-black leading-none">{product.materialSpecs.composition}</p>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Weight</p>
                                <p className="text-[11px] font-bold text-black leading-none">{product.materialSpecs.gsm} GSM</p>
                            </div>
                            <div className="col-span-2 space-y-0.5">
                                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Properties</p>
                                <div className="flex flex-wrap gap-x-2">
                                    {product.materialSpecs.properties.map((p, i) => (
                                        <span key={i} className="text-[10px] text-gray-600 font-medium lowercase">
                                            {p}{i < product.materialSpecs!.properties.length - 1 ? " •" : ""}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Accordion Sections */}
            <div className="mt-4 border-t border-gray-100">
                {/* Shipping & Returns */}
                <div className="border-b border-gray-100">
                    <button 
                        onClick={() => toggleAccordion('shipping')}
                        className="w-full py-3.5 flex items-center justify-between group"
                    >
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black group-hover:text-[#8B8378] transition-colors">
                            Shipping & Returns {openAccordion === 'shipping' ? '−' : '+'}
                        </span>
                    </button>
                    <div className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'shipping' ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-gray-600 leading-relaxed">
                                Standard shipping takes 3-5 business days. Returns accepted within 14 days of delivery. Items must be in original condition with tags attached.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Product Measurements */}
                <div className="border-b border-gray-100">
                    <button 
                        onClick={() => toggleAccordion('measurements')}
                        className="w-full py-3.5 flex items-center justify-between group"
                    >
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black group-hover:text-[#8B8378] transition-colors">
                            Product Measurements {openAccordion === 'measurements' ? '−' : '+'}
                        </span>
                    </button>
                    <div className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'measurements' ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                            <div className="space-y-2">
                                <p className="text-[10px] text-gray-600 leading-relaxed font-bold uppercase">Size Guide (inches)</p>
                                <div className="grid grid-cols-4 gap-2 text-[10px] text-gray-600">
                                    <div className="font-bold">Size</div>
                                    <div className="font-bold">Length</div>
                                    <div className="font-bold">Sleeve</div>
                                    <div className="font-bold">Shoulder</div>
                                    <div>54</div><div>54"</div><div>27"</div><div>16"</div>
                                    <div>56</div><div>56"</div><div>28"</div><div>16.5"</div>
                                    <div>58</div><div>58"</div><div>29"</div><div>17"</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
