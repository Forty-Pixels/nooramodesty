"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const categories = [
  { name: "ABAYAS", slug: "abayas" },
  { name: "CORD SETS", slug: "cord-sets" },
  { name: "TOPS", slug: "tops" },
  { name: "OCCASION WEAR", slug: "occasion-wear" },
];

const subCategoriesMap: Record<string, string[]> = {
  abayas: ["embroidered", "coat"],
  "cord-sets": ["embroidered", "long", "one-piece", "printed"],
  tops: ["embroidered", "plain", "printed"],
  "occasion-wear": ["abayas", "overcoats", "tops", "sets"],
};

const HoverLink = ({ href, children, className = "", onClick, isActive }: { href: string, children: React.ReactNode, className?: string, onClick?: () => void, isActive?: boolean }) => (
  <Link
    href={href}
    onClick={onClick}
    className={`group relative inline-flex items-center justify-center overflow-hidden py-2 whitespace-nowrap transition-all duration-300 ${isActive ? "bg-black text-white" : "bg-white text-black"} ${className}`}
  >
    {!isActive && (
      <span className="absolute inset-0 w-full h-full bg-black transform translate-y-full group-hover:translate-y-0 transition-transform duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] z-0"></span>
    )}
    <span className={`relative z-10 transition-colors duration-300 ease-out ${!isActive ? "group-hover:text-white" : ""}`}>{children}</span>
  </Link>
);

const CategoryHeader = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Detect current sub-category from path (/category/abayas/coat) or query (?style=coat)
  const pathnameParts = pathname.split("/");
  const mainFromPath = pathnameParts[2]; // The segment after /category/
  const subFromPath = pathnameParts[3]; // The segment after main category slug
  const subFromQuery = searchParams.get("style");
  const currentSub = subFromPath || subFromQuery;
  
  // Find which main category is active by exact match with the path segment
  const activeMain = categories.find(cat => cat.slug === mainFromPath)?.slug;
  const currentSubCats = activeMain ? subCategoriesMap[activeMain] : [];

  // Base path for sub-categories should be /category/[activeMain]
  const basePath = `/category/${activeMain}`;

  return (
    <div className="w-full bg-white pt-6 pb-8 md:pt-8 md:pb-12 border-b border-gray-50">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Main Categories Row */}
        <div className="flex justify-center items-center gap-2 md:gap-10 mb-6 md:mb-10">
          {categories.map((cat) => {
            const isActive = cat.slug === activeMain;
            return (
              <HoverLink
                key={cat.slug}
                href={`/category/${cat.slug}`}
                isActive={isActive}
                className="text-[0.6rem] md:text-xs font-bold tracking-[0.2em] md:tracking-[0.4em] px-3 md:px-4"
              >
                {cat.name}
              </HoverLink>
            );
          })}
        </div>

        {/* Sub-Categories Row (Refine) */}
        {currentSubCats.length > 0 && (
          <div className="flex justify-center items-center flex-wrap gap-4 md:gap-12 transition-all duration-500">
            <Link 
              href={basePath}
              className={`text-[0.55rem] md:text-[0.6rem] font-bold tracking-[0.2em] uppercase transition-all duration-300 py-1 ${!currentSub ? "text-black border-b border-black" : "text-gray-400 hover:text-black"}`}
            >
              ALL
            </Link>
            {currentSubCats.map((sub) => {
              const isActive = currentSub === sub;
              return (
                <Link
                  key={sub}
                  href={`${basePath}/${sub}`}
                  className={`text-[0.55rem] md:text-[0.6rem] font-bold tracking-[0.2em] uppercase transition-all duration-300 py-1 ${isActive ? "text-black border-b border-black" : "text-gray-400 hover:text-black"}`}
                >
                  {sub.replace("-", " ")}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryHeader;
