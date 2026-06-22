import { validateAdminSecret } from "@/lib/server/adminAuth";
import { runClickomProductSync } from "@/lib/server/clickomProductSync";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = validateAdminSecret(request.headers);
  if (authError) return authError;

  try {
    const body = (await request.json().catch(() => ({}))) as { apply?: unknown };
    const { report, markdown } = await runClickomProductSync({ apply: body.apply === true });

    return Response.json({
      ok: true,
      summary: {
        mode: report.mode,
        clickomCount: report.clickomCount,
        sanityCount: report.sanityCount,
        productMatches: report.productMatches.length,
        productUnmatched: report.productUnmatched.length,
        productAmbiguous: report.productAmbiguous.length,
        changed: report.changed.length,
      },
      report,
      markdown,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync Clickom products.";
    return Response.json({ error: message }, { status: 400 });
  }
}

