export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ variationId: string }> },
) {
  const { variationId } = await params;

  // TODO: Replace this placeholder with Clickom GET /customapi/stocks/{variation_id}
  // once CLICKOM_API_KEY is available. The request must stay server-side and include
  // the x-api-key header from process.env.CLICKOM_API_KEY.
  return Response.json({
    variationId,
    inStock: true,
    stock: 999,
  });
}
