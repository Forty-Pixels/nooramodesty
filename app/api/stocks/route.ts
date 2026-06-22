import { getClickomStock } from "@/lib/server/clickom";

export const runtime = "nodejs";
export const revalidate = 60;

interface StockRequestBody {
  variationIds?: unknown;
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
    const results = await Promise.allSettled(variationIds.map((variationId) => getClickomStock(variationId)));
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
        inStock: false,
        stock: 0,
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

