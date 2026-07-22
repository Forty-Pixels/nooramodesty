import { getClickomStock } from "@/lib/server/clickom";

export const runtime = "nodejs";

// A GET whose response carries these can be cached at Netlify's edge, so repeated
// lookups for the same product/listing are served without invoking the function.
// `durable` keeps the entry across edge nodes/deploys; POST could never be cached.
const STOCK_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
  "Netlify-CDN-Cache-Control": "public, durable, s-maxage=60, stale-while-revalidate=300",
};

// Clickom serves 24 concurrent stock lookups without complaint, so the old
// 3-at-a-time-with-a-stagger crawl was self-inflicted latency: it put ~1s of "checking
// stock" in front of every soft navigation. Keep a ceiling so a large listing page still
// can't stampede it, but stop pacing requests it never struggled with.
const STOCK_LOOKUP_CONCURRENCY = 8;
const STOCK_LOOKUP_STAGGER_MS = 0;

// Sorted so the request URL (and thus the CDN cache key) is identical regardless of
// the order a caller happens to pass IDs in.
function parseVariationIds(rawIds: string | null): string[] {
  if (!rawIds) return [];
  return Array.from(new Set(rawIds.split(",").map((value) => value.trim()).filter((value) => /^\d+$/.test(value)))).sort(
    (a, b) => Number(a) - Number(b),
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStocksWithLimitedConcurrency(variationIds: string[]) {
  const results = new Array<PromiseSettledResult<Awaited<ReturnType<typeof getClickomStock>>>>(variationIds.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < variationIds.length) {
      const currentIndex = nextIndex++;
      if (currentIndex > 0 && STOCK_LOOKUP_STAGGER_MS > 0) await delay(STOCK_LOOKUP_STAGGER_MS);
      try {
        results[currentIndex] = { status: "fulfilled", value: await getClickomStock(variationIds[currentIndex]) };
      } catch (error) {
        results[currentIndex] = { status: "rejected", reason: error };
      }
    }
  }

  const workerCount = Math.min(STOCK_LOOKUP_CONCURRENCY, variationIds.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}

export async function GET(request: Request) {
  const variationIds = parseVariationIds(new URL(request.url).searchParams.get("ids"));

  if (variationIds.length === 0) {
    return Response.json({ error: "ids must include at least one numeric variation ID." }, { status: 400 });
  }

  try {
    const results = await fetchStocksWithLimitedConcurrency(variationIds);
    const stocks = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return {
          variationId: result.value.variationId,
          inStock: result.value.inStock,
          stock: result.value.stock,
        };
      }

      return {
        variationId: variationIds[index],
        error: "Unable to confirm stock.",
      };
    });

    return Response.json({ stocks }, { headers: STOCK_CACHE_HEADERS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch stock.";
    return Response.json({ error: message }, { status: 502 });
  }
}

