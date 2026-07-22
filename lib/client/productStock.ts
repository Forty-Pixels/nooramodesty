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

export interface StockEntry {
  variationId: number;
  stock: number;
}

// Cacheable GET has a URL length ceiling, and smaller batches recur more often across
// pages (better edge-cache hit rate), so fan a large lookup out into fixed-size chunks.
const STOCK_ID_CHUNK_SIZE = 40;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

interface RawStockEntry {
  variationId: string | number;
  stock?: number;
  error?: string;
}

// A page mounts several stock-aware components at once (PDP: ProductInfo +
// CompleteTheLook), and React StrictMode fires every effect twice in dev — so the
// same chunk URL is requested concurrently many times over. Coalesce those into one
// in-flight request. The entry is dropped as soon as it settles, so a later forced
// refresh (retry after a stock rejection) still hits the network for fresh numbers.
const inFlightChunks = new Map<string, Promise<RawStockEntry[]>>();

function fetchChunk(idsCsv: string): Promise<RawStockEntry[]> {
  const existing = inFlightChunks.get(idsCsv);
  if (existing) return existing;

  const request = fetch(`/api/stocks?ids=${idsCsv}`)
    .then((response) => response.json())
    .then((data: { stocks?: RawStockEntry[] }) => data.stocks || [])
    .finally(() => {
      inFlightChunks.delete(idsCsv);
    });

  inFlightChunks.set(idsCsv, request);
  return request;
}

// Shared stock fetcher for every client caller. Sorts + dedupes so identical lookups
// produce identical URLs (stable cache key), chunks to bound URL length, and merges
// the results. Only entries with a real number are returned — an absent variation must
// stay distinguishable from a zero-stock one, or a Clickom hiccup reads as "sold out".
export async function fetchStocks(variationIds: number[]): Promise<StockEntry[]> {
  const ids = Array.from(new Set(variationIds.filter((id) => Number.isFinite(id) && id > 0))).sort((a, b) => a - b);
  if (ids.length === 0) return [];

  const responses = await Promise.all(chunk(ids, STOCK_ID_CHUNK_SIZE).map((idChunk) => fetchChunk(idChunk.join(","))));

  return responses
    .flat()
    .filter((entry) => !entry.error && typeof entry.stock === "number")
    .map((entry) => ({ variationId: Number(entry.variationId), stock: entry.stock as number }));
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

    fetchStocks(ids)
      .then((entries) => {
        if (cancelled) return;
        setStockByVariationId(Object.fromEntries(entries.map((entry) => [entry.variationId, entry.stock])));
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
