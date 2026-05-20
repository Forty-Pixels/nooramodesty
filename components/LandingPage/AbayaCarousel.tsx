"use client";

import React from "react";
import { abayas } from "@/data/products";
import ProductCarousel from "./ProductCarousel";

const AbayaCarousel = () => {
  return <ProductCarousel title="ABAYAS" products={abayas.slice(0, 8)} />;
};

export default AbayaCarousel;
