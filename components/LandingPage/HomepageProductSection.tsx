"use client";

import React from "react";
import { Product } from "@/types/product";
import ProductCarousel from "./ProductCarousel";

interface HomepageProductSectionProps {
  title: string;
  categorySlug?: string;
  products: Product[];
}

const homepageCategoryHrefs: Record<string, string> = {
  abayas: "/category/abayas",
  "cord sets": "/category/cord-sets",
  "cord set": "/category/cord-sets",
  "co ord sets": "/category/cord-sets",
  "co-ord sets": "/category/cord-sets",
  tops: "/category/tops",
  "occasion wear": "/category/occasion-wear",
  "occassion wear": "/category/occasion-wear",
  dresses: "/category/dresses",
  sale: "/category/sale",
};

function normalizeCategoryTitle(title: string) {
  return title.trim().toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9-]+/g, " ");
}

function createCategorySlug(title: string) {
  return title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveCategoryHref(title: string, categorySlug: string | undefined, products: Product[]) {
  const firstProductCategory = products.find((product) => product.category)?.category;
  const titleHref = homepageCategoryHrefs[normalizeCategoryTitle(title)];

  return titleHref || `/category/${categorySlug || firstProductCategory || createCategorySlug(title)}`;
}

export const HomepageProductSection: React.FC<HomepageProductSectionProps> = ({
  title,
  categorySlug,
  products,
}) => {
  const viewAllHref = resolveCategoryHref(title, categorySlug, products);

  return <ProductCarousel title={title} viewAllHref={viewAllHref} products={products.slice(0, 8)} />;
};
