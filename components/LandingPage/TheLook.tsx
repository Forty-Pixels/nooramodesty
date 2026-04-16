"use client";

import Link from "next/link";
import Image from "next/image";
import { theLook } from "@/data/products";

const TheLook = () => {
  return (
    <section className="pt-10 md:pt-16 pb-12 md:pb-20 bg-[#f6f5f3]">
      <div className="w-full flex flex-col items-center">
        {/* Section Heading */}
        <h2 className="text-[0.8rem] md:text-sm font-bold tracking-[0.5em] uppercase text-black mb-6 md:mb-8 text-center px-4 md:px-6">
          THE LOOK
        </h2>

        {/* Simplified Grid mirroring Carousel layout but without internal titles/arrows */}
        <div className="w-full overflow-hidden mb-4 md:mb-6">
          <div className="flex -mx-1 md:-mx-2">
          {theLook.map((product) => (
            <Link 
              key={product._id} 
              href={`/product/${product.slug}`}
              className="w-1/3 px-1 md:px-2 block group cursor-pointer"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#f6f5f3]">
                <Image
                  src={product.mainImage}
                  alt={product.title}
                  fill
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  sizes="33vw"
                />
              </div>
            </Link>
          ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TheLook;
