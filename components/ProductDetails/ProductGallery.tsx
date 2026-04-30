"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ProductGalleryProps {
    images: string[];
}

export const ProductGallery = ({ images }: ProductGalleryProps) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Show only first 6 images in a grid as per screenshot
    const displayImages = images.slice(0, 6);

    const handleNext = useCallback(() => {
        if (selectedIndex === null) return;
        setSelectedIndex((prev) => (prev !== null && prev < images.length - 1 ? prev + 1 : 0));
    }, [selectedIndex, images.length]);

    const handlePrev = useCallback(() => {
        if (selectedIndex === null) return;
        setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : images.length - 1));
    }, [selectedIndex, images.length]);

    const handleClose = () => setSelectedIndex(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (selectedIndex === null) return;
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
            if (e.key === "Escape") handleClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        if (selectedIndex !== null) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "unset";
        };
    }, [selectedIndex, handleNext, handlePrev]);

    return (
        <>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
                {displayImages.map((img, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => setSelectedIndex(idx)}
                        className="relative aspect-[3/4] overflow-hidden bg-white group border border-transparent hover:border-gray-100 transition-colors cursor-zoom-in"
                    >
                        <Image
                            src={img}
                            alt={`Product view ${idx + 1}`}
                            fill
                            sizes="(max-width: 768px) 33vw, 25vw"
                            priority={idx < 3}
                            className="object-cover object-center w-full h-full block transition-transform duration-700 ease-in-out group-hover:scale-110 will-change-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-white/95 backdrop-blur-md"
                        onClick={handleClose}
                    >
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute top-6 right-6 p-2 text-black hover:bg-gray-100 rounded-full transition-colors z-[210]"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClose();
                            }}
                        >
                            <X size={24} strokeWidth={1.5} />
                        </motion.button>

                        <div 
                            className="relative w-full h-full flex items-center justify-center px-4 md:px-20"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Navigation Buttons */}
                            <button
                                className="absolute left-4 md:left-8 p-3 text-black hover:bg-gray-100 rounded-full transition-all z-[210] disabled:opacity-30"
                                onClick={handlePrev}
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={32} strokeWidth={1} />
                            </button>

                            <button
                                className="absolute right-4 md:right-8 p-3 text-black hover:bg-gray-100 rounded-full transition-all z-[210] disabled:opacity-30"
                                onClick={handleNext}
                                aria-label="Next image"
                            >
                                <ChevronRight size={32} strokeWidth={1} />
                            </button>

                            {/* Main Image Container */}
                            <div className="relative w-full max-w-4xl h-[80vh] md:h-[90vh] touch-none">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedIndex}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3, ease: "easeOut" }}
                                        drag="x"
                                        dragConstraints={{ left: 0, right: 0 }}
                                        dragElastic={0.2}
                                        onDragEnd={(_, info) => {
                                            if (info.offset.x > 50) handlePrev();
                                            else if (info.offset.x < -50) handleNext();
                                        }}
                                        className="relative w-full h-full cursor-grab active:cursor-grabbing"
                                    >
                                        <Image
                                            src={images[selectedIndex]}
                                            alt={`Product view ${selectedIndex + 1}`}
                                            fill
                                            className="object-contain pointer-events-none"
                                            priority
                                            sizes="100vw"
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Image Counter/Indicator */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                    {selectedIndex + 1} / {images.length}
                                </span>
                                <div className="flex gap-1.5">
                                    {images.map((_, i) => (
                                        <div 
                                            key={i}
                                            className={`h-1 transition-all duration-300 ${i === selectedIndex ? "w-6 bg-black" : "w-1.5 bg-gray-200"}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

