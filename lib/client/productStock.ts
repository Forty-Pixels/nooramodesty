"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";

export function collectVariationIds(products: Array<Pick<Product, "subVariations">>): number[] {
  const ids = new Set<number>();
  products.forEach((product) => {
    (product.subVariations || []).forEach((subVariation) => {
      if (Number.isFinite(subVariation.clickomVariationId) && subVariation.clickomVariationId > 0) {
        ids.add(subVariation.clickomVariationId);
      }
    });
  });
  return Array.from(ids);
}

// `refreshToken` re-runs the lookup when it changes — bump it after an order is
// rejected on stock so the quantities on screen match what the error message says.
export function useVariationStockMap(variationIds: number[], refreshToken = 0): Record<number, number> {
  const key = variationIds
    .slice()
    .sort((a, b) => a - b)
    .join(",");
  const [stockByVariationId, setStockByVariationId] = useState<Record<number, number>>({});

  useEffect(() => {
    const ids = key ? key.split(",").map(Number) : [];
    if (ids.length === 0) return;

    let cancelled = false;

    fetch("/api/stocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variationIds: ids }),
    })
      .then((response) => response.json())
      .then((data: { stocks?: Array<{ variationId: string | number; stock?: number; error?: string }> }) => {
        if (cancelled) return;
        setStockByVariationId(
          Object.fromEntries(
            (data.stocks || [])
              .filter((stock) => !stock.error && typeof stock.stock === "number")
              .map((stock) => [Number(stock.variationId), stock.stock as number]),
          ),
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [key, refreshToken]);

  return stockByVariationId;
}

export function isProductSoldOut(
  product: Pick<Product, "subVariations" | "enablePreOrders">,
  stockByVariationId: Record<number, number>,
): boolean {
  if (product.enablePreOrders) return false;

  const variationIds = (product.subVariations || [])
    .map((subVariation) => subVariation.clickomVariationId)
    .filter((id): id is number => Number.isFinite(id) && id > 0);

  if (variationIds.length === 0) return false;
  if (!variationIds.every((id) => id in stockByVariationId)) return false;

  return variationIds.every((id) => (stockByVariationId[id] || 0) <= 0);
}
