"use client";

import React, { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterDrawer } from "@/components/Category/FilterDrawer";
import { FilterDropdown } from "@/components/ui/FilterDropdown";
import { ProductFacets, sortFilterOptions } from "@/utils/productFilters";

interface FilterDraft extends Record<string, string> {
  category: string;
  availability: string;
  size: string;
  color: string;
  minPrice: string;
  maxPrice: string;
}

interface ListingControlsProps {
  facets: ProductFacets;
  resultCount: number;
  showCategoryFilter?: boolean;
  showSearchInput?: boolean;
}

export const ListingControls: React.FC<ListingControlsProps> = ({
  facets,
  resultCount,
  showCategoryFilter = false,
  showSearchInput = true,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [nameQuery, setNameQuery] = useState("");
  const [filterDraft, setFilterDraft] = useState<FilterDraft>({
    category: "",
    availability: "",
    size: "",
    color: "",
    minPrice: "",
    maxPrice: "",
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const hasActiveFilters = [
    "q",
    "category",
    "color",
    "size",
    "availability",
    "minPrice",
    "maxPrice",
    "sort",
  ].some((key) => searchParams.has(key));

  useEffect(() => {
    setNameQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const getFilterValuesFromUrl = (): FilterDraft => ({
    category: searchParams.get("category") || "",
    availability: searchParams.get("availability") || "",
    size: searchParams.get("size") || "",
    color: searchParams.get("color") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
  });

  const openFilters = () => {
    setFilterDraft(getFilterValuesFromUrl());
    setIsFilterOpen(true);
  };

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === "default") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleNameSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ q: nameQuery.trim() });
  };

  const handleReset = () => {
    router.push(pathname, { scroll: false });
    setIsFilterOpen(false);
  };

  const updateFilterDraft = (updates: Record<string, string>) => {
    setFilterDraft((current) => ({ ...current, ...updates }));
  };

  const clearFilterDraft = () => {
    setFilterDraft({
      category: "",
      availability: "",
      size: "",
      color: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  const applyFilterDraft = () => {
    updateParams(filterDraft);
    setIsFilterOpen(false);
  };

  return (
    <div className="border-b border-black/5 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={isFilterOpen ? () => setIsFilterOpen(false) : openFilters}
              className="inline-flex h-10 items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-black transition-opacity hover:opacity-70"
            >
              <SlidersHorizontal size={15} strokeWidth={1.5} />
              Filters
            </button>

            {showSearchInput && (
              <form onSubmit={handleNameSubmit}>
                <input
                  value={nameQuery}
                  onChange={(event) => setNameQuery(event.target.value)}
                  placeholder="Search by name"
                  className="h-10 w-full min-w-60 border border-black/30 bg-white px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-black outline-none placeholder:text-gray-500 focus:border-black sm:w-60"
                />
              </form>
            )}
          </div>

          <div className="flex items-center gap-4">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex h-10 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 transition-colors hover:text-black"
              >
                <X size={13} strokeWidth={1.5} />
                Clear
              </button>
            )}
            <FilterDropdown
              label="Sort By"
              value={searchParams.get("sort") || ""}
              options={sortFilterOptions}
              onChange={(value) => updateParams({ sort: value })}
            />
          </div>
        </div>
      </div>
      <FilterDrawer
        isOpen={isFilterOpen}
        facets={facets}
        resultCount={resultCount}
        showCategoryFilter={showCategoryFilter}
        values={filterDraft}
        onChange={updateFilterDraft}
        onClear={clearFilterDraft}
        onClose={() => setIsFilterOpen(false)}
        onPrimaryAction={applyFilterDraft}
        primaryActionLabel="View Results"
      />
    </div>
  );
};
