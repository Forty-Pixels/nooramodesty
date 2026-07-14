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

export interface VariationStockState {
  stockByVariationId: Record<number, number>;
  // True until the first lookup settles. Callers that gate a quantity stepper must
  // wait for this: treating "not fetched yet" as "no limit" lets a shopper wind the
  // quantity up to the hard cap before the real stock ever lands on screen.
  isLoadingStock: boolean;
}

// `refreshToken` re-runs the lookup when it changes — bump it after an order is
// rejected on stock so the quantities on screen match what the error message says.
export function useVariationStockState(variationIds: number[], refreshToken = 0): VariationStockState {
  const key = variationIds
    .slice()
    .sort((a, b) => a - b)
    .join(",");
  const requestKey = `${key}|${refreshToken}`;
  const [stockByVariationId, setStockByVariationId] = useState<Record<number, number>>({});
  const [settledRequestKey, setSettledRequestKey] = useState<string | null>(null);

  // Derived, not stored: nothing to load when there are no variations, otherwise we
  // are loading until this exact request settles.
  const isLoadingStock = key.length > 0 && settledRequestKey !== requestKey;

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
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSettledRequestKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [key, requestKey]);

  return { stockByVariationId, isLoadingStock };
}

// Convenience wrapper for callers that only paint sold-out badges and have no
// quantity stepper to gate — they can treat "unknown" as "not sold out" safely.
export function useVariationStockMap(variationIds: number[], refreshToken = 0): Record<number, number> {
  return useVariationStockState(variationIds, refreshToken).stockByVariationId;
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
