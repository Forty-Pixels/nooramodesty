import { getAllProducts } from "@/lib/sanity/products";
import { buildCatalogCsv } from "@/lib/server/catalogFeed";
import { getStockByVariationId } from "@/lib/server/productStock";
import { Product } from "@/types/product";

export const runtime = "nodejs";

// Deliberately unauthenticated: Meta fetches this on a schedule and cannot present our admin
// secret. It exposes nothing the storefront doesn't already render publicly.
export const revalidate = 900;

function stockCheckedVariationIds(products: Product[]): number[] {
  const variationIds = new Set<number>();

  for (const product of products) {
    // Pre-order items are never held against Clickom stock — they ship as "in stock" without
    // a lookup, so spending an ERP call on them would only slow the feed down.
    if (product.enablePreOrders) continue;

    for (const subVariation of product.subVariations || []) {
      if (Number.isFinite(subVariation.clickomVariationId) && subVariation.clickomVariationId > 0) {
        variationIds.add(subVariation.clickomVariationId);
      }
    }
  }

  return Array.from(variationIds);
}

export async function GET() {
  try {
    const products = await getAllProducts();
    const stockByVariationId = await getStockByVariationId(stockCheckedVariationIds(products));
    const csv = buildCatalogCsv(products, stockByVariationId);

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="noora-modesty-catalog.csv"',
        "cache-control": "public, max-age=900, s-maxage=900",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to build catalog feed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
