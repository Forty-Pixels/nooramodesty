"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const sortOptions = [
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A-Z", value: "name-asc" },
  { label: "Name: Z-A", value: "name-desc" },
];

export const ListingControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentSort = searchParams.get("sort") || "default";
  const selectedLabel = sortOptions.find(opt => opt.value === currentSort)?.label || "Sort By";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "default") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  return (
    <div className="flex justify-end px-4 md:px-6 lg:px-8 py-6 border-b border-black/5 bg-white">
      <div className="relative" ref={containerRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.2em] hover:opacity-70 transition-opacity cursor-pointer h-full"
        >
          <span className="text-gray-400">Sort By:</span>
          <span className="text-black">{selectedLabel}</span>
          <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 top-full right-0 mt-4 bg-white border border-black/10 shadow-2xl min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="py-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`w-full text-left px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors
                    ${currentSort === option.value ? "bg-black text-white" : "text-gray-500 hover:bg-[#f6f5f3] hover:text-black"}
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
