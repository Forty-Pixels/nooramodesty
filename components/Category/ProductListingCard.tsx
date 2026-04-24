"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Product } from "@/types/product";
import useCartStore from "@/store";

interface ProductListingCardProps {
  product: Product;
}

const ProductListingCard: React.FC<ProductListingCardProps> = ({ product }) => {
  const { toggleWishlist, wishlistItems } = useCartStore();
  const isWishlisted = wishlistItems.some(item => item._id === product._id);

  return (
    <div className="group flex flex-col w-full relative">
      {/* Image Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f6f5f3]">
        <Link href={`/product/${product.slug}`} className="block h-full w-full">
          <Image
            src={product.mainImage}
            alt={product.title}
            fill
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </Link>

        {/* Wishlist Heart Icon - White Outline as in design */}
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
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            size={22}
            strokeWidth={1.2}
            className={`transition-all duration-300 ${
              isWishlisted ? "fill-[#8B8378] text-[#8B8378]" : "text-white"
            }`}
          />
        </button>
      </div>

      {/* Product Details - Compact as in design */}
      <div className="py-2.5 px-3 bg-white flex flex-col gap-0.5">
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.2em] uppercase text-black hover:opacity-70 transition-opacity">
            {product.title}
          </h3>
        </Link>
        {product.price && (
          <p className="text-[0.55rem] md:text-[0.6rem] text-black font-medium tracking-wider">
            LKR {product.price.toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductListingCard;
