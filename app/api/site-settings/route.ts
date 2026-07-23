import { fetchPublicSiteSettings } from "@/lib/server/siteSettings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await fetchPublicSiteSettings();
    return Response.json(settings, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        // Durable edge cache: site settings are fetched on mount of the cart (the
        // busiest page), checkout, and every PDP. Without this Netlify directive the
        // request misses the edge and invokes the function each time.
        "Netlify-CDN-Cache-Control": "public, durable, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return Response.json({ error: "Unable to load site settings." }, { status: 500 });
  }
}

