"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CategoryNavigationItem, CategoryNavigationSubCategory } from "@/types/categoryNavigation";

interface CategoryHeaderProps {
  categories: CategoryNavigationItem[];
}

interface HeaderCategory {
  _id: string;
  title: string;
  slug: string;
  subCategories: CategoryNavigationSubCategory[];
}

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

function clearanceSubCategories(categories: CategoryNavigationItem[]): CategoryNavigationSubCategory[] {
  return categories.map((category, index) => ({
    _id: `clearance-${category.slug}`,
    title: category.title,
    slug: category.slug,
    sortOrder: index,
  }));
}

function getHeaderCategories(categories: CategoryNavigationItem[]): HeaderCategory[] {
  return [
    ...categories,
    {
      _id: "clearance",
      title: "Clearance",
      slug: "clearance",
      subCategories: clearanceSubCategories(categories),
    },
  ];
}

const CategoryHeader = ({ categories }: CategoryHeaderProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const headerCategories = getHeaderCategories(categories);

  const pathnameParts = pathname.split("/");
  const mainFromPath = pathnameParts[2];
  const subFromPath = pathnameParts[3];
  const subFromQuery = searchParams.get("style");
  const currentSub = subFromPath || subFromQuery;

  const activeCategory = headerCategories.find((category) => category.slug === mainFromPath);
  const currentSubCats = activeCategory?.subCategories || [];
  const basePath = `/category/${activeCategory?.slug || mainFromPath || ""}`;

  return (
    <div className="w-full bg-white pt-6 pb-8 md:pt-8 md:pb-12 border-b border-gray-50">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex justify-center items-center flex-wrap gap-x-4 gap-y-3 md:gap-x-10 mb-6 md:mb-10 px-4 md:px-0">
          {headerCategories.map((category) => {
            const isActive = category.slug === activeCategory?.slug;
            return (
              <HoverLink
                key={category._id}
                href={`/category/${category.slug}`}
                isActive={isActive}
                className="text-[0.6rem] md:text-xs font-bold tracking-[0.2em] md:tracking-[0.4em] px-3 md:px-4"
              >
                {category.title.toUpperCase()}
              </HoverLink>
            );
          })}
        </div>

        {currentSubCats.length > 0 && (
          <div className="flex justify-center items-center flex-wrap gap-x-6 gap-y-2 md:gap-x-12 transition-all duration-500">
            <Link
              href={basePath}
              className={`text-[0.55rem] md:text-[0.6rem] font-bold tracking-[0.2em] uppercase transition-all duration-300 py-1 ${!currentSub ? "text-black border-b border-black" : "text-gray-400 hover:text-black"}`}
            >
              ALL
            </Link>
            {currentSubCats.map((subCategory) => {
              const isActive = currentSub === subCategory.slug;
              return (
                <Link
                  key={subCategory._id}
                  href={`${basePath}/${subCategory.slug}`}
                  className={`text-[0.55rem] md:text-[0.6rem] font-bold tracking-[0.2em] uppercase transition-all duration-300 py-1 ${isActive ? "text-black border-b border-black" : "text-gray-400 hover:text-black"}`}
                >
                  {subCategory.title}
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
