"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const images = [
  "/landing-page/media-carousel/image-1.png",
  "/landing-page/media-carousel/image-2.png",
  "/landing-page/media-carousel/image-3.png",
  "/landing-page/media-carousel/v2-image-4.png",
  "/landing-page/media-carousel/v2-image-5.png",
  "/landing-page/media-carousel/v2-image-6.png",
  "/landing-page/media-carousel/v2-image-7.png",
  "/landing-page/media-carousel/v2-image-8.png",
  "/landing-page/media-carousel/v2-image-9.png",
];

const MediaCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const maxIndex = images.length - 3;

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  // Framer Motion drag constraints and logic
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
    <section className="pt-10 md:pt-16 pb-10 md:pb-16 bg-[#f6f5f3] overflow-hidden relative group">
      <div className="w-full relative px-0" ref={containerRef}>
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          style={{ x: dragX }}
          onDragEnd={onDragEnd}
          className="flex"
          animate={{
            translateX: `-${currentIndex * 33.333}%`,
          }}
          transition={{
            type: "spring",
            damping: 30,
            stiffness: 200,
          }}
        >
          {images.map((src, index) => (
            <div 
              key={index} 
              className="flex-shrink-0 w-1/3"
            >
              <div className="relative aspect-[9/16] w-full overflow-hidden bg-[#f6f5f3]">
                <Image
                  src={src}
                  alt={`Editorial Photography ${index + 1}`}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 33vw, 33vw"
                  priority={index < 6}
                />
              </div>
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
    </section>
  );
};

export default MediaCarousel;
