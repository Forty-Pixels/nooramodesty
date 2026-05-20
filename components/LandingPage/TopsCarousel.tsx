"use client";

import React from "react";
import { tops } from "@/data/products";
import ProductCarousel from "./ProductCarousel";

const TopsCarousel = () => {
  return <ProductCarousel title="TOPS" products={tops.slice(0, 8)} />;
};

export default TopsCarousel;
