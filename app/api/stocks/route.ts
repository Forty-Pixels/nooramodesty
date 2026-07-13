import { getClickomStock } from "@/lib/server/clickom";

export const runtime = "nodejs";
export const revalidate = 60;

const STOCK_LOOKUP_CONCURRENCY = 3;
const STOCK_LOOKUP_STAGGER_MS = 120;

interface StockRequestBody {
  variationIds?: unknown;
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
      if (currentIndex > 0) await delay(STOCK_LOOKUP_STAGGER_MS);
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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as StockRequestBody;
  const variationIds = Array.isArray(body.variationIds)
    ? Array.from(new Set(body.variationIds.map((value) => String(value)).filter((value) => /^\d+$/.test(value))))
    : [];

  if (variationIds.length === 0) {
    return Response.json({ error: "variationIds must include at least one numeric ID." }, { status: 400 });
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

    return Response.json(
      { stocks },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch stock.";
    return Response.json({ error: message }, { status: 502 });
  }
}

