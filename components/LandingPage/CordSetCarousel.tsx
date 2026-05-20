"use client";

import React from "react";
import { cordSets } from "@/data/products";
import ProductCarousel from "./ProductCarousel";

const CordSetCarousel = () => {
  return <ProductCarousel title="CORD SETS" products={cordSets.slice(0, 8)} />;
};

export default CordSetCarousel;
