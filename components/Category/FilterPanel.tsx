"use client";

import React, { useState } from "react";
import { FilterSection } from "@/components/Category/FilterSection";
import { FacetOption, ProductFacets } from "@/utils/productFilters";

interface FilterPanelProps {
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
  onChange: (updates: Record<string, string>) => void;
}

const formatPrice = (value: string | number) => `LKR ${Number(value || 0).toLocaleString()}`;

export const FilterPanel: React.FC<FilterPanelProps> = ({
  facets,
  values,
  showCategoryFilter = false,
  onChange,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    availability: false,
    price: false,
    category: false,
    size: false,
    color: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }));
  };

  const toggleValue = (key: string, value: string) => {
    onChange({ [key]: values[key as keyof typeof values] === value ? "" : value });
  };

  const renderRows = (key: "availability" | "size" | "color" | "category", options: Array<FacetOption | { label: string; value: string; count?: number }>) => (
    <div className="space-y-3">
      {options.map((option) => {
        const isActive = values[key] === option.value;
        return (
          <button
            key={option.value || option.label}
            type="button"
            onClick={() => toggleValue(key, option.value)}
            className="flex w-full items-center justify-between gap-4 text-left text-sm text-[#3a3a3a] transition-colors hover:text-black"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${isActive ? "border-black bg-black" : "border-gray-400 bg-white"}`}>
                {isActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>
              {"swatch" in option && option.swatch && (
                <span className="h-4 w-4 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: option.swatch }} />
              )}
              <span className="truncate">{option.label}</span>
            </span>
            {typeof option.count === "number" && <span className="shrink-0 text-sm text-gray-400">({option.count})</span>}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="w-full bg-white">
      {showCategoryFilter && (
        <FilterSection title="Category" isOpen={openSections.category} onToggle={() => toggleSection("category")}>
          {renderRows("category", facets.categories)}
        </FilterSection>
      )}

      <FilterSection title="Availability" isOpen={openSections.availability} onToggle={() => toggleSection("availability")}>
        {renderRows("availability", facets.availability)}
      </FilterSection>

      <FilterSection title="Price" isOpen={openSections.price} onToggle={() => toggleSection("price")}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex flex-col gap-2 text-gray-500">
              From
              <input
                value={values.minPrice || ""}
                onChange={(event) => onChange({ minPrice: event.target.value })}
                inputMode="numeric"
                placeholder={formatPrice(facets.minPrice)}
                className="h-10 w-32 border border-black/10 px-3 text-xs font-bold text-black outline-none focus:border-black/40"
              />
            </label>
            <label className="flex flex-col gap-2 text-gray-500">
              To
              <input
                value={values.maxPrice || ""}
                onChange={(event) => onChange({ maxPrice: event.target.value })}
                inputMode="numeric"
                placeholder={formatPrice(facets.maxPrice)}
                className="h-10 w-32 border border-black/10 px-3 text-xs font-bold text-black outline-none focus:border-black/40"
              />
            </label>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Size" isOpen={openSections.size} onToggle={() => toggleSection("size")}>
        {renderRows("size", facets.sizes)}
      </FilterSection>

      <FilterSection title="Color" isOpen={openSections.color} onToggle={() => toggleSection("color")}>
        {renderRows("color", facets.colors)}
      </FilterSection>
    </div>
  );
};
