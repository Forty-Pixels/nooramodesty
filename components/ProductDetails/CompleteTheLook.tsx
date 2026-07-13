"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types/product";
import useCartStore from "@/store";
import { collectVariationIds, isProductSoldOut, useVariationStockMap } from "@/lib/client/productStock";

interface CompleteTheLookProps {
    products: Product[];
    parentProductTitle: string;
    viewMoreHref?: string;
}

export const CompleteTheLook = ({ products, parentProductTitle, viewMoreHref }: CompleteTheLookProps) => {
    const { addItem } = useCartStore();
    const [noteByProductId, setNoteByProductId] = useState<Record<string, string>>({});
    const [addedProductId, setAddedProductId] = useState<string | null>(null);
    const stockByVariationId = useVariationStockMap(collectVariationIds(products));

    if (products.length === 0) return null;

    const handleAdd = (product: Product) => {
        if (isProductSoldOut(product, stockByVariationId)) return;

        const subVariation = product.subVariations?.[0];
        const note = (noteByProductId[product._id] || "").trim();
        const customNote = note ? `For: ${parentProductTitle}. Note: ${note}` : `For: ${parentProductTitle}`;

        addItem({
            _id: `${product._id}-accessory-${encodeURIComponent(customNote)}`,
            productId: product._id,
            title: product.title,
            slug: product.slug,
            price: product.salePrice || product.price,
            originalPrice: product.salePrice ? product.price : undefined,
            image: product.mainImage,
            quantity: 1,
            size: subVariation?.size,
            clickomVariationId: subVariation?.clickomVariationId,
            sku: subVariation?.sku,
            customSize: false,
            customNote,
        });

        setAddedProductId(product._id);
        setTimeout(() => setAddedProductId(null), 2000);
    };

    return (
        <div className="mt-16 md:mt-20">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-[0.4em] uppercase text-black">
                    Complete The Look
                </h2>
                {viewMoreHref && (
                    <Link
                        href={viewMoreHref}
                        className="text-[0.6rem] font-bold tracking-[0.3em] uppercase text-gray-400 hover:text-black transition-colors"
                    >
                        View More
                    </Link>
                )}
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
                {products.map((product) => {
                    const isSoldOut = isProductSoldOut(product, stockByVariationId);
                    return (
                    <div key={product._id} className="flex-none w-32 md:w-40 space-y-2">
                        <Link href={`/product/${product.slug}`} className="group block">
                            <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                                <Image
                                    src={product.mainImage}
                                    alt={product.title}
                                    fill
                                    sizes="(max-width: 768px) 33vw, 160px"
                                    className={`object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
                                        isSoldOut ? "opacity-40 saturate-0 blur-[0.4px]" : ""
                                    }`}
                                />
                                {isSoldOut && (
                                    <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/70 backdrop-blur-md py-2 text-center border-t border-black/5">
                                        <span className="text-[0.5rem] font-bold uppercase tracking-[0.3em] text-black/50">
                                            Sold Out
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-2 space-y-0.5">
                                <h3 className="text-[9px] uppercase tracking-widest font-bold truncate text-black">{product.title}</h3>
                                <p className={`text-[9px] font-bold ${product.salePrice ? "text-[#B21E1E]" : "text-black"}`}>
                                    LKR {(product.salePrice || product.price).toLocaleString()}
                                </p>
                            </div>
                        </Link>
                        <input
                            value={noteByProductId[product._id] || ""}
                            onChange={(event) =>
                                setNoteByProductId((current) => ({ ...current, [product._id]: event.target.value }))
                            }
                            placeholder="Note (optional)"
                            className="w-full border border-gray-200 px-2 py-1.5 text-[9px] focus:outline-none focus:border-black/40 placeholder:text-gray-300"
                        />
                        <button
                            type="button"
                            onClick={() => handleAdd(product)}
                            disabled={isSoldOut}
                            className={`w-full py-1.5 text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                isSoldOut
                                    ? "border-gray-200 text-gray-300 cursor-not-allowed"
                                    : "border-[#8B8378] text-[#8B8378] hover:bg-gray-50"
                            }`}
                        >
                            {isSoldOut ? "Sold Out" : addedProductId === product._id ? "Added" : "Add to Bag"}
                        </button>
                    </div>
                    );
                })}
            </div>
        </div>
    );
};
