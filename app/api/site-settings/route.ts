import { fetchPublicSiteSettings } from "@/lib/server/siteSettings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await fetchPublicSiteSettings();
    return Response.json(settings);
  } catch {
    return Response.json({ error: "Unable to load site settings." }, { status: 500 });
  }
}

