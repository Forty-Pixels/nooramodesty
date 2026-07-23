import "server-only";
import { unstable_cache } from "next/cache";
import { getClickomStock } from "@/lib/server/clickom";
import { Product } from "@/types/product";

// Caches the stock read behind a 60s boundary so the PDP render path no longer
// contains a `no-store` fetch. Without this the page is forced dynamic and the
// Netlify function runs on every view; with it the page is served from cache and
// only regenerates ~once per minute. The client still re-fetches live stock on
// mount (and checkout re-validates), so a first-paint number up to 60s stale is
// corrected within ~1s and can never cause an oversell.
const getCachedStockByVariationId = unstable_cache(
  (variationIds: number[]) => getStockByVariationId(variationIds),
  ["pdp-stock"],
  { revalidate: 60, tags: ["stock"] },
);

// Pre-order items are never held against Clickom stock, so resolving them is pure waste —
// a pre-order abaya with seven sizes was costing seven ERP lookups on every render.
export async function getStockForProduct(
  product: Pick<Product, "subVariations" | "enablePreOrders">,
): Promise<Record<number, number>> {
  if (product.enablePreOrders) return {};
  return getCachedStockByVariationId(variationIdsForProduct(product));
}

export function variationIdsForProduct(product: Pick<Product, "subVariations">): number[] {
  return Array.from(
    new Set(
      (product.subVariations || [])
        .map((subVariation) => subVariation.clickomVariationId)
        .filter((variationId): variationId is number => Number.isFinite(variationId) && variationId > 0),
    ),
  );
}

// Resolves stock on the server so the PDP ships real numbers in its first paint,
// rather than rendering an unbounded quantity stepper while a client fetch is in
// flight. A variation whose lookup fails is left out of the map entirely — absent
// must stay distinguishable from zero, or a Clickom hiccup reads as "sold out".
export async function getStockByVariationId(variationIds: number[]): Promise<Record<number, number>> {
  if (variationIds.length === 0) return {};

  const results = await Promise.all(
    variationIds.map(async (variationId) => {
      try {
        const { stock } = await getClickomStock(String(variationId));
        return [variationId, stock] as const;
      } catch {
        return null;
      }
    }),
  );

  return Object.fromEntries(results.filter((entry): entry is readonly [number, number] => entry !== null));
}
