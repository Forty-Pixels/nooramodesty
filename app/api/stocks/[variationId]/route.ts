import { getClickomStock } from "@/lib/server/clickom";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variationId: string }> },
) {
  const { variationId } = await params;

  if (!variationId || !/^\d+$/.test(variationId)) {
    return Response.json({ error: "Variation ID must be numeric." }, { status: 400 });
  }

  try {
    const stock = await getClickomStock(variationId);

    return Response.json(
      {
        variationId: stock.variationId,
        inStock: stock.inStock,
        stock: stock.stock,
      },
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
