"use client";

import React from "react";
import { cordSets } from "@/data/products";
import ProductCarousel from "./ProductCarousel";

const CordSetCarousel = () => {
  return <ProductCarousel title="CORD SETS" products={cordSets} />;
};

export default CordSetCarousel;
