"use client";

import Image from "next/image";

interface ProductGalleryProps {
    images: string[];
}

export const ProductGallery = ({ images }: ProductGalleryProps) => {
    // Show only first 6 images in a grid as per screenshot
    const displayImages = images.slice(0, 6);

    return (
        <div className="grid grid-cols-3 gap-2 md:gap-3">
            {displayImages.map((img, idx) => (
                <div key={idx} className="relative aspect-[3/4] overflow-hidden bg-white group border border-transparent hover:border-gray-100 transition-colors">
                    {/* The Image component with forced fill and cover */}
                    <Image
                        src={img}
                        alt={`Product view ${idx + 1}`}
                        fill
                        sizes="(max-width: 768px) 33vw, 25vw"
                        priority={idx < 3}
                        className="object-cover object-center w-full h-full block transition-transform duration-700 ease-in-out group-hover:scale-110 will-change-transform"
                    />
                    {/* Subtle overlay for depth */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500 pointer-events-none" />
                </div>
            ))}
        </div>
    );
};
