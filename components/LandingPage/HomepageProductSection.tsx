"use client";

import React from "react";
import { Product } from "@/types/product";
import ProductCarousel from "./ProductCarousel";

interface HomepageProductSectionProps {
  title: string;
  categorySlug?: string;
  products: Product[];
}

// Category slugs come from Sanity — never guess them from a section's title.
// A section links to the category it references; if it has none (e.g. a curated
// "Best Sellers" row), fall back to the category its products belong to.
function resolveCategoryHref(categorySlug: string | undefined, products: Product[]): string | undefined {
  if (categorySlug) return `/category/${categorySlug}`;

  const firstProductCategory = products.find((product) => product.category)?.category;
  return firstProductCategory ? `/category/${firstProductCategory}` : undefined;
}

export const HomepageProductSection: React.FC<HomepageProductSectionProps> = ({
  title,
  categorySlug,
  products,
}) => {
  const viewAllHref = resolveCategoryHref(categorySlug, products);

  return <ProductCarousel title={title} viewAllHref={viewAllHref} products={products.slice(0, 8)} />;
};
