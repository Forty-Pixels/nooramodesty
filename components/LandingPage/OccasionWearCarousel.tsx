"use client";

import React from "react";
import { abayas, cordSets } from "@/data/products";
import ProductCarousel from "./ProductCarousel";

const OccasionWearCarousel = () => {
  const occasionProducts = [
    ...abayas.slice(0, 4),
    ...cordSets.slice(0, 4),
  ];

  return (
    <ProductCarousel title="OCCASION WEAR" products={occasionProducts} />
  );
};

export { OccasionWearCarousel };
