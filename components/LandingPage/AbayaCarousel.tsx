"use client";

import React from "react";
import { abayas } from "@/data/products";
import ProductCarousel from "./ProductCarousel";

const AbayaCarousel = () => {
  return <ProductCarousel title="ABAYAS" products={abayas} />;
};

export default AbayaCarousel;
