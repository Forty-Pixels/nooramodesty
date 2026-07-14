"use client";

import { Product } from "@/types/product";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import useCartStore from "@/store";
import { Heart, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { isStoreLocatorActive } from "@/utils/featureFlags";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from "@/lib/shipping";
import { PublicSiteSettings } from "@/types/siteSettings";
import { uniqueMessages, validateMeasurement } from "@/utils/formValidation";

interface ProductInfoProps {
    product: Product;
    initialStockByVariationId: Record<number, number>;
    onSoldOutChange?: (isSoldOut: boolean) => void;
}

const isCustomSizeLabel = (size: string | undefined) => (size || "").trim().toLowerCase() === "custom";

export const ProductInfo = ({ product, initialStockByVariationId, onSoldOutChange }: ProductInfoProps) => {
    const firstSize = product.subVariations?.find((subVariation) => !isCustomSizeLabel(subVariation.size))?.size || "";
    const materialProperties = product.materialSpecs?.properties || [];
    const hasMaterialSpecs = Boolean(
        product.materialSpecs?.macroImage ||
        product.materialSpecs?.composition ||
        product.materialSpecs?.gsm ||
        materialProperties.length > 0
    );
    const [selectedSize, setSelectedSize] = useState(firstSize);
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [customMeasurements, setCustomMeasurements] = useState({ length: "", bust: "", hip: "", sleeve: "" });
    const [customMeasurementErrors, setCustomMeasurementErrors] = useState<string[]>([]);
    const [isCustomSize, setIsCustomSize] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>(null);
    const [isAdded, setIsAdded] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [stockByVariationId, setStockByVariationId] = useState<Record<number, number>>(initialStockByVariationId);
    const [hasStockLookupFailed, setHasStockLookupFailed] = useState(false);
    const [stockRetryToken, setStockRetryToken] = useState(0);
    const [showStoreLocatorModal, setShowStoreLocatorModal] = useState(false);
    const [siteSettings, setSiteSettings] = useState<PublicSiteSettings>(DEFAULT_SITE_SETTINGS);

    const { addItem, toggleWishlist, wishlistItems, setBuyNowItem } = useCartStore();
    const isWishlisted = wishlistItems.some(item => item._id === product._id);
    const router = useRouter();

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    const displaySizes = product.subVariations
        ?.filter((subVariation) => !isCustomSizeLabel(subVariation.size))
        .map((subVariation) => subVariation.size)
        .filter(Boolean) || [];
    const customSubVariation = useMemo(() => {
        return product.subVariations?.find((subVariation) => isCustomSizeLabel(subVariation.size));
    }, [product.subVariations]);

    const selectedSubVariation = useMemo(() => {
        return product.subVariations?.find((subVariation) => subVariation.size === selectedSize);
    }, [product.subVariations, selectedSize]);
    const selectedAvailableStock = selectedSubVariation?.clickomVariationId
        ? stockByVariationId[selectedSubVariation.clickomVariationId]
        : undefined;
    const isSelectedOutOfStock = selectedSubVariation?.clickomVariationId
        ? (selectedAvailableStock ?? Infinity) <= 0
        : false;

    // A pre-order or custom-size item is never held against Clickom stock, so it has nothing to
    // wait for. Everything else must show a real number before it can be ordered — until then the
    // quantity has no ceiling to enforce, which is what let the stepper run to 20 unchecked.
    const requiresStockCheck =
        !product.enablePreOrders && !isCustomSize && Boolean(selectedSubVariation?.clickomVariationId);
    const isStockPending =
        requiresStockCheck && typeof selectedAvailableStock !== "number" && !hasStockLookupFailed;

    const canOrderSelectedVariation = Boolean(
        selectedSubVariation &&
        !isStockPending &&
        (!isSelectedOutOfStock || product.enablePreOrders || isCustomSize),
    );
    const isProductSoldOut = Boolean(
        !product.enablePreOrders &&
        displaySizes.length > 0 &&
        displaySizes.every((size) => {
            const subVariation = product.subVariations?.find((item) => item.size === size);
            return subVariation?.clickomVariationId
                ? (stockByVariationId[subVariation.clickomVariationId] ?? Infinity) <= 0
                : false;
        }),
    );
    const hasKnownStockLimit = !product.enablePreOrders && !isCustomSize && typeof selectedAvailableStock === "number";
    // Clickom never gave us a number for this variation. Don't pretend the ceiling is 20 —
    // hold the quantity at 1 and say so, rather than silently reverting to the unbounded
    // stepper this whole feature exists to prevent.
    const couldNotConfirmStock = requiresStockCheck && hasStockLookupFailed && !hasKnownStockLimit;
    const maxOrderableQuantity = hasKnownStockLimit
        ? Math.max(1, Math.min(20, selectedAvailableStock as number))
        : couldNotConfirmStock
            ? 1
            : 20;
    const safeQuantity = Math.min(quantity, maxOrderableQuantity);
    useEffect(() => {
        onSoldOutChange?.(isProductSoldOut);
    }, [isProductSoldOut, onSoldOutChange]);

    const whatsappHref = (() => {
        const digits = siteSettings.whatsappNumber?.replace(/\D/g, "");
        if (!digits) return undefined;
        const productUrl = typeof window !== "undefined" ? window.location.href : "";
        const message = `Hi Noora Modesty, I'm interested in ${product.title}${productUrl ? ` (${productUrl})` : ""}.`;
        return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    })();

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

    useEffect(() => {
        const variationIds = Array.from(
            new Set(
                (product.subVariations || [])
                    .map((subVariation) => subVariation.clickomVariationId)
                    .filter((variationId): variationId is number => Number.isFinite(variationId) && variationId > 0),
            ),
        );

        // Pre-order items are never held against Clickom stock, so don't spend a lookup on them.
        if (product.enablePreOrders || variationIds.length === 0) return;

        let cancelled = false;

        // This lookup is not a nicety — on a soft navigation it is the *only* source of stock.
        // Next serves a static shell when it prefetches a dynamic route, so a PDP opened from a
        // listing arrives with an empty stock map no matter how well the server render works.
        // Be patient rather than clever: keep retrying the variations still missing, crediting
        // whatever each attempt does return, for ~15s before admitting defeat.
        const backoffMs = [500, 1000, 2000, 4000, 8000];

        async function loadStock() {
            const resolved = new Set<number>();

            for (let attempt = 0; attempt <= backoffMs.length; attempt += 1) {
                if (cancelled) return;

                const missingVariationIds = variationIds.filter((variationId) => !resolved.has(variationId));
                if (missingVariationIds.length === 0) return;

                try {
                    const response = await fetch("/api/stocks", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ variationIds: missingVariationIds }),
                    });
                    const data = (await response.json()) as {
                        stocks?: Array<{ variationId: string | number; stock?: number; error?: string }>;
                    };

                    if (cancelled) return;

                    const refreshedStock = Object.fromEntries(
                        (data.stocks || [])
                            .filter((stock) => !stock.error && typeof stock.stock === "number")
                            .map((stock) => [Number(stock.variationId), stock.stock as number]),
                    );

                    if (Object.keys(refreshedStock).length > 0) {
                        Object.keys(refreshedStock).forEach((variationId) => resolved.add(Number(variationId)));
                        // Merge, never replace: a variation this attempt failed to resolve must keep
                        // the number the server rendered, not regress to "unknown".
                        setStockByVariationId((current) => ({ ...current, ...refreshedStock }));
                        setHasStockLookupFailed(false);
                    }

                    if (variationIds.every((variationId) => resolved.has(variationId))) return;
                } catch {
                    // Fall through to the retry.
                }

                if (attempt < backoffMs.length) {
                    await new Promise((resolve) => setTimeout(resolve, backoffMs[attempt]));
                }
            }

            // Out of patience. This must NOT quietly restore an unbounded stepper — that is the
            // state the whole feature exists to prevent. The quantity stays pinned at 1 and the
            // shopper is told the count could not be confirmed, with a way to try again.
            if (!cancelled) setHasStockLookupFailed(true);
        }

        void loadStock();

        return () => {
            cancelled = true;
        };
    }, [product.subVariations, product.enablePreOrders, stockRetryToken]);

    const getCustomNote = () => {
        if (!isCustomSize) return undefined;
        return `Custom — Length: ${customMeasurements.length}", Bust: ${customMeasurements.bust}", Hip: ${customMeasurements.hip}", Sleeve: ${customMeasurements.sleeve}"`;
    };

    const handleAddToBag = () => {
        if (!canOrderSelectedVariation) return;

        const customNote = getCustomNote();
        const size = isCustomSize ? "Custom" : selectedSize;
        const basePrice = product.salePrice || product.price;
        const finalPrice = isCustomSize ? basePrice + siteSettings.customSizeCharge : basePrice;
        const originalPrice = product.salePrice ? product.price : undefined;
        const finalOriginalPrice = isCustomSize && originalPrice ? originalPrice + siteSettings.customSizeCharge : originalPrice;
        
        addItem({
            _id: `${product._id}-${size}-${customNote ? encodeURIComponent(customNote) : ""}`,
            productId: product._id,
            title: product.title,
            slug: product.slug,
            price: finalPrice,
            originalPrice: finalOriginalPrice,
            image: product.mainImage,
            quantity: safeQuantity,
            color: product.colorHex || undefined,
            colorName: product.colorName,
            colorHex: product.colorHex || undefined,
            size: size,
            clickomVariationId: selectedSubVariation?.clickomVariationId,
            sku: selectedSubVariation?.sku,
            customSize: isCustomSize,
            preOrder: product.enablePreOrders || isCustomSize,
            customLength: isCustomSize ? customMeasurements.length : undefined,
            customBust: isCustomSize ? customMeasurements.bust : undefined,
            customHip: isCustomSize ? customMeasurements.hip : undefined,
            customSleeve: isCustomSize ? customMeasurements.sleeve : undefined,
            customNote: customNote
        });
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };

    const handleToggleWishlist = () => {
        toggleWishlist({
            _id: product._id,
            title: product.title,
            price: product.salePrice || product.price,
            image: product.mainImage,
            slug: product.slug,
        });
    };

    const handleBuyNow = () => {
        if (!canOrderSelectedVariation) return;

        const customNote = getCustomNote();
        const size = isCustomSize ? "Custom" : selectedSize;
        const basePrice = product.salePrice || product.price;
        const finalPrice = isCustomSize ? basePrice + siteSettings.customSizeCharge : basePrice;
        const originalPrice = product.salePrice ? product.price : undefined;
        const finalOriginalPrice = isCustomSize && originalPrice ? originalPrice + siteSettings.customSizeCharge : originalPrice;

        setBuyNowItem({
            _id: `${product._id}-${size}-${customNote ? encodeURIComponent(customNote) : ""}`,
            productId: product._id,
            title: product.title,
            slug: product.slug,
            price: finalPrice,
            originalPrice: finalOriginalPrice,
            image: product.mainImage,
            quantity: safeQuantity,
            color: product.colorHex || undefined,
            colorName: product.colorName,
            colorHex: product.colorHex || undefined,
            size: size,
            clickomVariationId: selectedSubVariation?.clickomVariationId,
            sku: selectedSubVariation?.sku,
            customSize: isCustomSize,
            preOrder: product.enablePreOrders || isCustomSize,
            customLength: isCustomSize ? customMeasurements.length : undefined,
            customBust: isCustomSize ? customMeasurements.bust : undefined,
            customHip: isCustomSize ? customMeasurements.hip : undefined,
            customSleeve: isCustomSize ? customMeasurements.sleeve : undefined,
            customNote: customNote
        });
        router.push("/checkout?buyNow=true");
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = uniqueMessages([
            ...validateMeasurement(customMeasurements.length, "Length"),
            ...validateMeasurement(customMeasurements.bust, "Bust"),
            ...validateMeasurement(customMeasurements.hip, "Hip"),
            ...validateMeasurement(customMeasurements.sleeve, "Sleeve"),
        ]);

        if (validationErrors.length > 0) {
            setCustomMeasurementErrors(validationErrors);
            return;
        }

        setCustomMeasurementErrors([]);
        setCustomMeasurements({
            length: customMeasurements.length.trim(),
            bust: customMeasurements.bust.trim(),
            hip: customMeasurements.hip.trim(),
            sleeve: customMeasurements.sleeve.trim(),
        });
        if (customSubVariation) {
            setSelectedSize(customSubVariation.size);
        }
        setIsCustomSize(true);
        setShowCustomModal(false);
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
                {product.salePrice ? (
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-1.5">
                            {product.isNewArrival && (
                                <span className="bg-black text-white text-[0.65rem] font-bold tracking-[0.1em] px-2.5 py-1 uppercase w-max rounded-sm">
                                    New Arrival
                                </span>
                            )}
                            <span className="bg-[#B21E1E] text-white text-[0.65rem] font-bold tracking-[0.1em] px-2.5 py-1 uppercase w-max rounded-sm">
                                {Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <p className="text-xl font-bold text-[#B21E1E]">
                                LKR {product.salePrice.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-400 line-through font-medium">
                                LKR {product.price.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {product.isNewArrival && (
                            <span className="inline-flex bg-black text-white text-[0.65rem] font-bold tracking-[0.1em] px-2.5 py-1 uppercase w-max rounded-sm">
                                New Arrival
                            </span>
                        )}
                        <p className="text-lg font-bold">
                            LKR {product.price.toLocaleString()}
                        </p>
                    </div>
                )}
                
                {/* Stock Status - Only show if Low or Out of Stock */}
                {(product.stockStatus === "low-stock" || product.stockStatus === "out-of-stock") && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                            product.stockStatus === "low-stock" ? "bg-amber-500 animate-pulse" :
                            "bg-[#B21E1E]"
                        }`} />
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${
                            product.stockStatus === "low-stock" ? "text-amber-700/80" :
                            "text-[#B21E1E]/80"
                        }`}>
                            {product.stockStatus === "low-stock" && `Hurry! Only ${product.stockCount} left in stock`}
                            {product.stockStatus === "out-of-stock" && "Out of Stock"}
                        </span>
                    </div>
                )}
                {product.showLowStock && product.stockStatus !== "out-of-stock" && (
                    <div className="flex items-center gap-2 mt-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-700/80">
                            {product.manualStockCount ? `Only ${product.manualStockCount} left` : "Low stock"}
                        </span>
                    </div>
                )}

                <div className="w-28 h-[1px] bg-gray-200 mt-2" />
            </div>

            {/* Collection Info */}
            <div className="mt-1 space-y-2">
                {(product.colorName || product.colorHex) && (
                    <div className="flex items-center gap-1.5">
                        <p className="text-[10px] text-black tracking-wide font-bold">
                            Color: <span className="text-gray-400 font-normal">{product.colorName}</span>
                        </p>
                        {product.colorHex && (
                            <span
                                className="w-3.5 h-3.5 rounded-full border border-gray-200"
                                style={{ backgroundColor: product.colorHex }}
                                aria-hidden="true"
                            />
                        )}
                    </div>
                )}
                <div className="space-y-0.5">
                    <p className="text-[10px] text-black tracking-wide font-bold">
                        Type: <span className="text-gray-400 font-normal">{product.type}</span>
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

            {/* Size Selector */}
            <div className="mt-2">
                <div className="w-full max-w-sm space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Size</label>
                    <div className="flex flex-wrap gap-2 items-end">
                        {displaySizes.map((s) => {
                            const subVariation = product.subVariations?.find((item) => item.size === s);
                            const isMissingClickomVariation = !subVariation?.clickomVariationId;
                            const isOutOfStock = subVariation?.clickomVariationId ? (stockByVariationId[subVariation.clickomVariationId] ?? Infinity) <= 0 : false;
                            const isBlockedByStock = isOutOfStock && !product.enablePreOrders;
                            return (
                                <button
                                    key={s}
                                    disabled={isMissingClickomVariation || (isBlockedByStock && !isStoreLocatorActive)}
                                    onClick={() => {
                                        if (isBlockedByStock && isStoreLocatorActive) {
                                            setShowStoreLocatorModal(true);
                                        } else {
                                            setSelectedSize(s);
                                            setIsCustomSize(false);
                                        }
                                    }}
                                    className={`min-w-7 h-7 px-2 flex items-center justify-center text-center text-[10px] leading-none font-bold border transition-all duration-300 relative overflow-hidden whitespace-nowrap ${
                                        selectedSize === s && !isCustomSize && (!isOutOfStock || product.enablePreOrders) && !isMissingClickomVariation
                                        ? "bg-[#8B8378] text-white border-[#8B8378]" 
                                        : "bg-white text-black border-gray-200 hover:border-[#8B8378]"
                                    } ${isMissingClickomVariation || isBlockedByStock ? `opacity-25 ${isStoreLocatorActive && !isMissingClickomVariation ? "cursor-pointer" : "cursor-not-allowed"}` : "cursor-pointer"}`}
                                    title={isMissingClickomVariation ? "Unavailable" : isOutOfStock && product.enablePreOrders ? "Available for pre-order" : isOutOfStock ? "Out of Stock" : undefined}
                                >
                                    {s}
                                    {(isMissingClickomVariation || isBlockedByStock) && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="absolute w-[140%] h-[1px] bg-black/40 rotate-45" />
                                            <div className="absolute w-[140%] h-[1px] bg-black/40 -rotate-45" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                        {product.enableCustomSizes && customSubVariation && <div className="relative flex flex-col items-center">
                            <span className="text-[6px] md:text-[7px] text-[#8B8378] font-bold uppercase tracking-wider mb-1.5 whitespace-nowrap animate-pulse">
                                Customize Size
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomMeasurementErrors([]);
                                    setShowCustomModal(true);
                                }}
                                className={`min-w-7 h-7 px-2 flex items-center justify-center text-sm font-bold border transition-all duration-300 ${
                                    isCustomSize
                                    ? "bg-black text-white border-black" 
                                    : "bg-white text-black border-gray-200 hover:border-black"
                                }`}
                            >
                                +
                            </button>
                        </div>}
                    </div>
                </div>
            </div>

            {/* Quantity Selector */}
            <div className="mt-2">
                <div className="w-full max-w-sm space-y-1.5">
                    <label className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Quantity</label>
                    {isStockPending ? (
                        <div className="space-y-1.5" aria-live="polite" aria-busy="true">
                            <div className="h-8 w-[6rem] animate-pulse bg-gray-100 border border-gray-200" aria-hidden="true" />
                            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                                Checking stock…
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center border border-gray-200 w-fit">
                                <button
                                    type="button"
                                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                                    disabled={safeQuantity <= 1}
                                    className="w-8 h-8 flex items-center justify-center text-sm font-bold text-black disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>
                                <span className="w-8 h-8 flex items-center justify-center text-[11px] font-bold text-black">
                                    {safeQuantity}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((current) => Math.min(maxOrderableQuantity, current + 1))}
                                    disabled={safeQuantity >= maxOrderableQuantity}
                                    className="w-8 h-8 flex items-center justify-center text-sm font-bold text-black disabled:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>
                            {hasKnownStockLimit && (selectedAvailableStock as number) < 20 && (
                                <p className="text-[9px] font-bold uppercase tracking-widest text-amber-700/80">
                                    Only {Math.max(0, selectedAvailableStock as number)} in stock
                                </p>
                            )}
                            {couldNotConfirmStock && (
                                <p className="text-[9px] font-bold uppercase tracking-widest text-[#B21E1E]/80">
                                    Couldn&apos;t confirm stock.{" "}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setHasStockLookupFailed(false);
                                            setStockRetryToken((current) => current + 1);
                                        }}
                                        className="underline hover:text-black transition-colors cursor-pointer"
                                    >
                                        Retry
                                    </button>
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {showCustomModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
                    <div className="bg-white w-full max-w-sm p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-black">Custom Size</h3>
                                <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 font-bold leading-relaxed">
                                    Custom sizes are made to order and include an additional LKR {siteSettings.customSizeCharge.toLocaleString()}.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomMeasurementErrors([]);
                                    setShowCustomModal(false);
                                }}
                                className="text-gray-400 hover:text-black transition-colors"
                                aria-label="Close custom size form"
                            >
                                X
                            </button>
                        </div>

                        <form onSubmit={handleCustomSubmit} noValidate className="mt-8 space-y-5">
                            <input
                                value={customMeasurements.length}
                                onChange={(event) => setCustomMeasurements((current) => ({ ...current, length: event.target.value }))}
                                placeholder="Length"
                                inputMode="decimal"
                                aria-invalid={customMeasurementErrors.some((error) => error.startsWith("Length"))}
                                className="w-full border border-black/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-black/40 placeholder:text-gray-300"
                            />
                            <input
                                value={customMeasurements.bust}
                                onChange={(event) => setCustomMeasurements((current) => ({ ...current, bust: event.target.value }))}
                                placeholder="Bust"
                                inputMode="decimal"
                                aria-invalid={customMeasurementErrors.some((error) => error.startsWith("Bust"))}
                                className="w-full border border-black/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-black/40 placeholder:text-gray-300"
                            />
                            <input
                                value={customMeasurements.hip}
                                onChange={(event) => setCustomMeasurements((current) => ({ ...current, hip: event.target.value }))}
                                placeholder="Hip"
                                inputMode="decimal"
                                aria-invalid={customMeasurementErrors.some((error) => error.startsWith("Hip"))}
                                className="w-full border border-black/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-black/40 placeholder:text-gray-300"
                            />
                            <input
                                value={customMeasurements.sleeve}
                                onChange={(event) => setCustomMeasurements((current) => ({ ...current, sleeve: event.target.value }))}
                                placeholder="Sleeve"
                                inputMode="decimal"
                                aria-invalid={customMeasurementErrors.some((error) => error.startsWith("Sleeve"))}
                                className="w-full border border-black/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-black/40 placeholder:text-gray-300"
                            />
                            {customMeasurementErrors.length > 0 && (
                                <div className="border border-[#B21E1E]/20 bg-[#B21E1E]/5 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#B21E1E]" aria-live="polite">
                                    {customMeasurementErrors.length === 1 ? (
                                        <p>{customMeasurementErrors[0]}</p>
                                    ) : (
                                        <ul className="list-disc space-y-1 pl-4">
                                            {customMeasurementErrors.map((error) => (
                                                <li key={error}>{error}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                    setCustomMeasurementErrors([]);
                                    setShowCustomModal(false);
                                }}
                                    className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border border-black/10 text-gray-500 hover:text-black transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest bg-black text-white hover:bg-zinc-800 transition-all"
                                >
                                    Confirm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Store Locator Suggestion Modal */}
            {showStoreLocatorModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
                    <div className="bg-white w-full max-w-sm p-8 shadow-2xl animate-in fade-in zoom-in duration-300 text-center">
                        <div className="flex justify-end">
                            <button 
                                onClick={() => setShowStoreLocatorModal(false)} 
                                className="text-gray-400 hover:text-black transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="space-y-6 mt-2">
                            <div className="w-16 h-16 bg-[#f6f5f3] rounded-full flex items-center justify-center mx-auto text-black/60 shadow-inner">
                                <Send size={24} />
                            </div>
                            
                            <div className="space-y-2">
                                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-black">Item Unavailable Online</h3>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold leading-relaxed">
                                    We may not have this size in stock online, but you can find a physical store near you that might!
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <button 
                                    onClick={() => {
                                        setShowStoreLocatorModal(false);
                                        router.push("/store-locator");
                                    }}
                                    className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] bg-black text-white hover:bg-zinc-800 transition-all active:scale-95"
                                >
                                    Find a Store Near Me
                                </button>
                                <button 
                                    onClick={() => setShowStoreLocatorModal(false)}
                                    className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] border border-black/10 hover:bg-[#f6f5f3] hover:text-black transition-all text-gray-500"
                                >
                                    Continue Browsing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Size Guide */}
            {product.sizeGuideImage && <div className="mt-4 border-t border-b border-gray-100">
                <button
                    onClick={() => toggleAccordion('measurements')}
                    className="w-full py-3.5 flex items-center justify-between group"
                >
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black group-hover:text-[#8B8378] transition-colors">
                        Size Guide {openAccordion === 'measurements' ? '−' : '+'}
                    </span>
                </button>
                <div className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'measurements' ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden space-y-2">
                        <div className="relative w-full aspect-[4/3] bg-gray-50 border border-gray-100">
                            <Image
                                src={product.sizeGuideImage}
                                alt={`Size guide for ${product.title}`}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 420px"
                            />
                        </div>
                        <p className="text-[9px] text-gray-400 leading-relaxed">
                            For products, an error margin of +/-1 is to be expected on finishing.
                        </p>
                    </div>
                </div>
            </div>}

            {/* Actions */}
            <div className="mt-5 flex items-center gap-4">
                <button 
                    onClick={handleBuyNow}
                    disabled={!canOrderSelectedVariation}
                    className={`w-44 h-11 text-white text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        !canOrderSelectedVariation
                        ? "bg-gray-300 cursor-not-allowed" 
                        : "bg-[#8B8378] hover:bg-[#7a7166]"
                    }`}
                >
                    Buy Now
                </button>
                <button 
                    onClick={handleAddToBag}
                    disabled={!canOrderSelectedVariation}
                    className={`w-44 h-11 bg-white border text-[11px] font-bold uppercase tracking-widest transition-all relative overflow-hidden cursor-pointer ${
                        !canOrderSelectedVariation
                        ? "border-gray-200 text-gray-300 cursor-not-allowed"
                        : "border-[#8B8378] text-[#8B8378] hover:bg-gray-50"
                    }`}
                >
                    <span className={`absolute inset-0 flex items-center justify-center bg-[#8B8378] text-white transition-transform duration-300 ${isAdded ? "translate-y-0" : "translate-y-full"}`}>
                        ADDED TO BAG
                    </span>
                    <span className={`${isAdded ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}>
                        {isStockPending
                            ? "Checking Stock…"
                            : !canOrderSelectedVariation
                                ? (isProductSoldOut ? "Sold Out" : "Unavailable")
                                : "Add to Bag"}
                    </span>
                </button>
                {whatsappHref ? (
                    <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-11 h-11 border border-gray-300 hover:border-black transition-all flex items-center justify-center group cursor-pointer"
                        aria-label="Ask about this product on WhatsApp"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-7 h-7 fill-[#25D366] transition-colors"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.396.015 12.032c0 2.12.549 4.188 1.59 6.007L0 24l6.135-1.61c1.747.953 3.71 1.456 5.71 1.458h.005c6.635 0 12.031-5.396 12.033-12.033.001-3.216-1.251-6.241-3.526-8.517z"/>
                        </svg>
                    </a>
                ) : null}
            </div>

            <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
                Need support?{" "}
                {whatsappHref ? (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="underline hover:text-black transition-colors">
                        Contact us
                    </a>
                ) : (
                    "Contact us"
                )}
            </p>

            {/* Consolidated Material Quality Detail Section */}
            {product.materialSpecs && hasMaterialSpecs && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-black">Material Quality Detail</span>
                    </div>
                    
                    <div className="flex gap-5 items-start bg-gray-50/50 p-3.5 rounded-sm border border-gray-50">
                        {/* Macro Image Thumbnail */}
                        {product.materialSpecs.macroImage && (
                        <div className="relative w-16 h-16 bg-white border border-gray-100 flex-shrink-0">
                            <Image
                                src={product.materialSpecs.macroImage}
                                alt="Fabric Macro"
                                fill
                                className="object-cover"
                            />
                        </div>
                        )}

                        {/* Specs Grid */}
                        <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-2">
                            {product.materialSpecs.composition && (
                            <div className="space-y-0.5">
                                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Fabric Type</p>
                                <p className="text-[11px] font-bold text-black leading-none">{product.materialSpecs.composition}</p>
                            </div>
                            )}
                            {product.materialSpecs.gsm && (
                            <div className="space-y-0.5">
                                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Weight</p>
                                <p className="text-[11px] font-bold text-black leading-none">{product.materialSpecs.gsm} GSM</p>
                            </div>
                            )}
                            <div className="col-span-2 space-y-0.5">
                                <p className="text-[8px] uppercase tracking-widest text-gray-400 font-bold">Properties</p>
                                <div className="flex flex-wrap gap-x-2">
                                    {materialProperties.map((p, i) => (
                                        <span key={i} className="text-[10px] text-gray-600 font-medium lowercase">
                                            {p}{i < materialProperties.length - 1 ? " •" : ""}
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
                {/* Shipping */}
                <div className="border-b border-gray-100">
                    <button
                        onClick={() => toggleAccordion('shipping')}
                        className="w-full py-3.5 flex items-center justify-between group"
                    >
                        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-black group-hover:text-[#8B8378] transition-colors">
                            Shipping {openAccordion === 'shipping' ? '−' : '+'}
                        </span>
                    </button>
                    <div className={`grid transition-all duration-300 ease-in-out ${openAccordion === 'shipping' ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'}`}>
                        <div className="overflow-hidden">
                            <p className="text-[10px] text-gray-600 leading-relaxed">
                                Standard shipping takes 3-5 business days. Returns accepted within 14 days of delivery. Items must have tags intact and be returned with original packaging, including the courier bag.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
