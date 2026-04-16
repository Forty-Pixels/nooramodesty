"use client";

import React from "react";
import { tops } from "@/data/products";
import ProductCarousel from "./ProductCarousel";

const TopsCarousel = () => {
  return <ProductCarousel title="TOPS" products={tops} />;
};

export default TopsCarousel;
