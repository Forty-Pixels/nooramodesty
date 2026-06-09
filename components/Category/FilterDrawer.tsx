"use client";

import React from "react";
import { X } from "lucide-react";
import { FilterPanel } from "@/components/Category/FilterPanel";
import { ProductFacets } from "@/utils/productFilters";

interface FilterDrawerProps {
  isOpen: boolean;
  facets: ProductFacets;
  values: {
    category?: string;
    availability?: string;
    size?: string;
    color?: string;
    minPrice?: string;
    maxPrice?: string;
  };
  showCategoryFilter?: boolean;
  resultCount?: number;
  primaryActionLabel: string;
  onChange: (updates: Record<string, string>) => void;
  onClear: () => void;
  onClose: () => void;
  onPrimaryAction: () => void;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  facets,
  values,
  showCategoryFilter = false,
  resultCount,
  primaryActionLabel,
  onChange,
  onClear,
  onClose,
  onPrimaryAction,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/35 backdrop-blur-[2px]">
      <button type="button" aria-label="Close filters" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[430px] flex-col bg-white shadow-2xl shadow-black/20">
        <div className="flex min-h-24 shrink-0 items-center justify-between border-b border-black/10 px-6 py-6">
          <h2 className="text-base font-bold uppercase tracking-[0.34em] text-black">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/30 bg-white text-black shadow-sm transition-colors hover:bg-[#f6f5f3]"
            aria-label="Close filters"
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
          <FilterPanel facets={facets} values={values} showCategoryFilter={showCategoryFilter} onChange={onChange} />
        </div>

        <div className="shrink-0 border-t border-black/10 bg-white p-5">
          {typeof resultCount === "number" && (
            <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
              {resultCount} {resultCount === 1 ? "Product" : "Products"} Found
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClear}
              className="h-11 border border-black/40 bg-white text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-colors hover:bg-[#f6f5f3]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onPrimaryAction}
              className="h-11 bg-black text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-opacity hover:opacity-85"
            >
              {primaryActionLabel}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
