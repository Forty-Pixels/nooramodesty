import { getAllProducts } from "@/lib/sanity/products";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await getAllProducts();
    return Response.json({ products });
  } catch {
    return Response.json({ error: "Unable to load products." }, { status: 500 });
  }
}
