"use client";

import React from "react";
import { Product } from "@/types/product";
import ProductCarousel from "./ProductCarousel";

interface HomepageProductSectionProps {
  title: string;
  products: Product[];
}

export const HomepageProductSection: React.FC<HomepageProductSectionProps> = ({ title, products }) => {
  return <ProductCarousel title={title} products={products.slice(0, 8)} />;
};
