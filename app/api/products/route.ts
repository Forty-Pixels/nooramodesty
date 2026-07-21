import { getAllProducts } from "@/lib/sanity/products";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await getAllProducts();
    return Response.json(
      { products },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return Response.json({ error: "Unable to load products." }, { status: 500 });
  }
}
