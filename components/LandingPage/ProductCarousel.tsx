"use client";

import React, { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useMotionValue, animate as animateMotionValue } from "framer-motion";
import { Product } from "@/types/product";
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import useCartStore from "@/store";

interface ProductCarouselProps {
  title: string;
  viewAllHref?: string;
  products: Product[];
}

const MOBILE_ITEMS_PER_VIEW = 2;
const MOBILE_PEEK_FRACTION = 0.25;
const MOBILE_TILE_WIDTH_PERCENT = 100 / (MOBILE_ITEMS_PER_VIEW + MOBILE_PEEK_FRACTION);
const DESKTOP_ITEMS_PER_VIEW = 4;
const DESKTOP_TILE_WIDTH_PERCENT = 100 / DESKTOP_ITEMS_PER_VIEW;
const MOBILE_MEDIA_QUERY = "(max-width: 767px)";
const VELOCITY_PROJECTION_FACTOR = 0.15;

function subscribeToMobileBreakpoint(callback: () => void) {
  const mediaQueryList = window.matchMedia(MOBILE_MEDIA_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getIsMobileSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getIsMobileServerSnapshot() {
  return false;
}

function useIsMobile() {
  return useSyncExternalStore(subscribeToMobileBreakpoint, getIsMobileSnapshot, getIsMobileServerSnapshot);
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, viewAllHref, products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isMobile = useIsMobile();
  const visibleProducts = products.filter((product) => product.mainImage && product.slug);
  const totalItems = visibleProducts.length + (viewAllHref ? 1 : 0);
  const { toggleWishlist, wishlistItems } = useCartStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const x = useMotionValue(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const itemsPerPage = isMobile ? MOBILE_ITEMS_PER_VIEW : DESKTOP_ITEMS_PER_VIEW;
  const tileWidthPercent = isMobile ? MOBILE_TILE_WIDTH_PERCENT : DESKTOP_TILE_WIDTH_PERCENT;
  const tileWidthPx = containerWidth * (tileWidthPercent / 100);
  const maxIndex = Math.max(0, totalItems - itemsPerPage);
  const safeCurrentIndex = Math.min(currentIndex, maxIndex);
  const isAtStart = safeCurrentIndex <= 0;
  const isAtEnd = safeCurrentIndex >= maxIndex;

  useEffect(() => {
    if (isDraggingRef.current || tileWidthPx === 0) return;
    const controls = animateMotionValue(x, -safeCurrentIndex * tileWidthPx, { type: "spring", stiffness: 380, damping: 38 });
    return () => controls.stop();
  }, [safeCurrentIndex, tileWidthPx, x]);

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <section className="pt-10 pb-2 md:pt-16 md:pb-4 bg-[#f6f5f3]">
      <div className="w-full flex flex-col items-center">
        {/* Section Heading */}
        <h2 className="text-[0.8rem] md:text-sm font-bold tracking-[0.5em] uppercase text-black mb-6 md:mb-8 text-center px-4 md:px-6">
          {title}
        </h2>

        {/* Carousel Container */}
        <div className="relative w-full overflow-hidden mb-4 md:mb-6 flex justify-center">
          <div className="w-full">
            <motion.div
              ref={containerRef}
              className="flex -mx-1 md:-mx-2 cursor-grab active:cursor-grabbing"
              style={{ x }}
              drag={tileWidthPx > 0 ? "x" : false}
              dragConstraints={{ left: -maxIndex * tileWidthPx, right: 0 }}
              dragElastic={0.08}
              dragMomentum={false}
              onDragStart={() => {
                isDraggingRef.current = true;
              }}
              onDragEnd={(_, info) => {
                isDraggingRef.current = false;
                if (tileWidthPx === 0) return;

                const projectedX = x.get() + info.velocity.x * VELOCITY_PROJECTION_FACTOR;
                const targetIndex = Math.round(-projectedX / tileWidthPx);
                setCurrentIndex(Math.max(0, Math.min(maxIndex, targetIndex)));
              }}
            >
              {visibleProducts.map((product, index) => {
                const isWishlisted = wishlistItems.some(item => item._id === product._id);
                return (
                  <div
                    key={`${product._id}-${index}`}
                    style={{ width: `${tileWidthPercent}%` }}
                    className="flex-shrink-0 px-1 md:px-2 block group relative"
                  >
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f6f5f3]">
                        <Image
                          src={product.mainImage}
                          alt={product.title}
                          fill
                          draggable={false}
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      </div>
                    </Link>

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist({
                            _id: product._id,
                            title: product.title,
                            price: product.salePrice || product.price,
                            image: product.mainImage,
                            slug: product.slug,
                        });
                      }}
                      className="absolute top-4 right-4 z-10 p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Heart
                        size={18}
                        className={`transition-all duration-300 ${
                          isWishlisted ? "fill-[#8B8378] text-[#8B8378]" : "text-white drop-shadow-sm"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>

                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="mt-4 flex flex-col gap-1 pl-1 md:pl-2">
                        <h3 className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-[0.2em] uppercase text-black">
                          {product.title}
                        </h3>
                        {product.salePrice ? (
                          <div className="flex items-center gap-2">
                            <p className="text-[0.6rem] md:text-[0.65rem] font-bold tracking-wider text-[#B21E1E]">
                              LKR {product.salePrice.toLocaleString()}
                            </p>
                            <p className="text-[0.55rem] md:text-[0.6rem] font-medium tracking-wider text-gray-400 line-through">
                              LKR {product.price.toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[0.6rem] md:text-[0.65rem] font-medium tracking-wider text-black">
                            LKR {product.price.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
              {viewAllHref && (
                <div style={{ width: `${tileWidthPercent}%` }} className="flex-shrink-0 px-1 md:px-2 block group">
                  <Link href={viewAllHref} className="block h-full">
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#e9e5df] flex items-center justify-center transition-colors duration-300 group-hover:bg-[#ddd7cf]">
                      <div className="flex flex-col items-center gap-4 text-black px-4 text-center">
                        <span className="text-[0.7rem] md:text-[0.8rem] font-bold tracking-[0.35em] uppercase">
                          View All
                        </span>
                        <span className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-black/40 flex items-center justify-center transition-colors duration-300 group-hover:bg-black group-hover:text-white">
                          <ArrowRight size={18} strokeWidth={1.5} />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Navigation Controls - Responsive bottom-right alignment */}
        <div className="w-full flex justify-end gap-2 pl-4 md:pl-6 pr-6 md:pr-10 mt-2 md:mt-4 relative z-10 transition-all duration-300">
          <button
            onClick={prevSlide}
            disabled={isAtStart}
            className="w-10 h-10 md:w-12 md:h-12 bg-[#8D8377] text-white flex items-center justify-center hover:bg-[#7a7166] transition-colors cursor-pointer shadow-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
            aria-label="Previous product"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={nextSlide}
            disabled={isAtEnd}
            className="w-10 h-10 md:w-12 md:h-12 bg-[#8D8377] text-white flex items-center justify-center hover:bg-[#7a7166] transition-colors cursor-pointer shadow-sm disabled:bg-gray-200 disabled:cursor-not-allowed"
            aria-label="Next product"
          >
            <ChevronRight size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
