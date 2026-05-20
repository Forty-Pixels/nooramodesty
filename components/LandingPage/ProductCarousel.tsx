"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Product } from "@/types/product";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import useCartStore from "@/store";

interface ProductCarouselProps {
  title: string;
  products: Product[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ title, products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const visibleProducts = products.filter((product) => product.mainImage && product.slug);
  const totalProducts = visibleProducts.length;
  const { toggleWishlist, wishlistItems } = useCartStore();

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth < 768 ? 2 : 4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, totalProducts - itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
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
              className="flex -mx-1 md:-mx-2"
              animate={{ x: `-${currentIndex * (100 / itemsPerPage)}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {visibleProducts.map((product, index) => {
                const isWishlisted = wishlistItems.some(item => item._id === product._id);
                return (
                  <div 
                    key={`${product._id}-${index}`}
                    className="flex-shrink-0 w-1/2 md:w-1/4 px-1 md:px-2 block group relative"
                  >
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f6f5f3]">
                        <Image
                          src={product.mainImage}
                          alt={product.title}
                          fill
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
                            price: product.price,
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
                      <div className="mt-4 flex items-start justify-between pl-1 md:pl-2">
                        <h3 className="text-[0.65rem] md:text-[0.7rem] font-bold tracking-[0.2em] uppercase text-black">
                          {product.title}
                        </h3>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Navigation Controls - Responsive bottom-right alignment */}
        <div className="w-full flex justify-end gap-2 pl-4 md:pl-6 pr-6 md:pr-10 mt-2 md:mt-4 relative z-10 transition-all duration-300">
          <button
            onClick={prevSlide}
            className="w-10 h-10 md:w-12 md:h-12 bg-[#8D8377] text-white flex items-center justify-center hover:bg-[#7a7166] transition-colors cursor-pointer shadow-sm"
            aria-label="Previous product"
          >
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-10 md:w-12 md:h-12 bg-[#8D8377] text-white flex items-center justify-center hover:bg-[#7a7166] transition-colors cursor-pointer shadow-sm"
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
