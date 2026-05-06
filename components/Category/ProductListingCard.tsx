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
        <div className={`relative aspect-[3/4] w-full overflow-hidden ${product.stockStatus === "out-of-stock" ? "bg-gray-50" : "bg-[#f6f5f3]"}`}>
          <Link href={`/product/${product.slug}`} className="block h-full w-full">
            <Image
              src={product.mainImage}
              alt={product.title}
              fill
              className={`object-cover object-center transition-all duration-1000 group-hover:scale-105 ${
                product.stockStatus === "out-of-stock" ? "opacity-40 saturate-0 blur-[0.4px]" : ""
              }`}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          </Link>
          
          {/* Badges Container (Sale & Low Stock only) */}
          {product.stockStatus !== "out-of-stock" && (
            <div className="absolute top-0 left-0 z-10 flex flex-col gap-0">
              {product.salePrice && (
                <div className="bg-[#B21E1E] text-white text-[0.55rem] font-bold tracking-[0.2em] px-3 py-1.5 uppercase">
                  {Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                </div>
              )}
              {product.stockStatus === "low-stock" && (
                <div className="bg-[#8B8378] text-white text-[0.55rem] font-bold tracking-[0.2em] px-3 py-1.5 uppercase">
                  Low Stock
                </div>
              )}
            </div>
          )}

          {/* Out of Stock Bottom Bar */}
          {product.stockStatus === "out-of-stock" && (
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/70 backdrop-blur-md py-3.5 text-center border-t border-black/5">
              <span className="text-[0.55rem] font-bold uppercase tracking-[0.5em] text-black/50 ml-[0.5em]">
                Out of Stock
              </span>
            </div>
          )}

        {/* Wishlist Heart Icon - White Outline as in design */}
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
          <div className="flex items-center gap-2">
            {product.salePrice ? (
              <>
                <p className="text-[0.55rem] md:text-[0.6rem] text-[#B21E1E] font-bold tracking-wider">
                  LKR {product.salePrice.toLocaleString()}
                </p>
                <p className="text-[0.5rem] md:text-[0.55rem] text-gray-400 font-medium tracking-wider line-through">
                  LKR {product.price.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-[0.55rem] md:text-[0.6rem] text-black font-medium tracking-wider">
                LKR {product.price.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductListingCard;
