"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const categories = [
  { name: "ABAYAS", slug: "abayas" },
  { name: "CORD SETS", slug: "cord-sets" },
  { name: "TOPS", slug: "tops" },
];

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

  return (
    <div className="w-full bg-white py-6 md:py-8">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex justify-center items-center gap-2 md:gap-10">
          {categories.map((cat) => {
            const isActive = pathname.includes(cat.slug);
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
      </div>
    </div>
  );
};

export default CategoryHeader;
