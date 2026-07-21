import { fetchPublicSiteSettings } from "@/lib/server/siteSettings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await fetchPublicSiteSettings();
    return Response.json(settings, {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch {
    return Response.json({ error: "Unable to load site settings." }, { status: 500 });
  }
}

