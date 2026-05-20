"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { InNooraImage } from "@/types/homepage";

interface InNooraProps {
  images: InNooraImage[];
}

const InNoora: React.FC<InNooraProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(2);
  const visibleImages = images.filter((image) => image.url && image.alt);
  const totalItems = visibleImages.length;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(2);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(4);
      } else {
        setItemsPerPage(6);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const maxIndex = Math.max(0, totalItems - itemsPerPage);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  // Framer Motion drag logic
  const dragX = useMotionValue(0);

  const onDragEnd = () => {
    const x = dragX.get();
    if (x <= -50) {
      nextSlide();
    } else if (x >= 50) {
      prevSlide();
    }
    dragX.set(0);
  };

  return (
    <section className="pt-10 pb-10 md:pt-16 md:pb-16 bg-[#f6f5f3] overflow-hidden group">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 md:mb-12 text-center px-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-[0.4em] text-black mb-4">
            #InNoora
          </h2>
          <p className="text-[0.7rem] md:text-xs font-medium tracking-[0.2em] uppercase text-gray-500">
            Featuring our customers
          </p>
        </div>

        {/* Carousel Container - Edges touch screen, gaps between items */}
        <div className="relative w-full overflow-hidden" ref={containerRef}>
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            style={{ x: dragX }}
            onDragEnd={onDragEnd}
            className="flex -mx-[1px] md:-mx-[2px]"
            animate={{
              translateX: `-${currentIndex * (100 / itemsPerPage)}%`,
            }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 200,
            }}
          >
            {visibleImages.map((image, index) => (
              <div 
                key={`${image._id}-${index}`}
                className="flex-shrink-0 px-[1px] md:px-[2px]"
                style={{ width: `${100 / itemsPerPage}%` }}
              >
                {image.productSlug ? (
                  <Link
                    href={`/product/${image.productSlug}`}
                    className="relative aspect-[4/5] w-full overflow-hidden bg-[#f6f5f3] block"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      priority={index < 6}
                    />
                  </Link>
                ) : (
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f6f5f3]">
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    className="object-cover transition-transform duration-700 ease-out hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
                    priority={index < 6}
                  />
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* Desktop Controls */}
          <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 w-full justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={prevSlide}
              className="w-12 h-12 bg-white/80 backdrop-blur-sm text-black flex items-center justify-center rounded-full hover:bg-white transition-all pointer-events-auto shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft size={24} strokeWidth={1.5} />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 bg-white/80 backdrop-blur-sm text-black flex items-center justify-center rounded-full hover:bg-white transition-all pointer-events-auto shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight size={24} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export { InNoora };
