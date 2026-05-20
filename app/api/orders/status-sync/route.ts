import { validateAdminSecret } from "@/lib/server/adminAuth";
import { getClickomSaleStatus } from "@/lib/server/clickom";
import { requireSanityWriteClient } from "@/lib/server/sanity";
import { SanityOrder } from "@/types/sanityOrder";

export const runtime = "nodejs";

const terminalStatuses = new Set(["completed", "cancelled"]);

function normalizeClickomStatus(status: string) {
  const normalized = status.toLowerCase();

  if (["completed", "complete", "delivered"].includes(normalized)) return "completed";
  if (["shipped", "dispatched"].includes(normalized)) return "shipped";
  if (["cancelled", "canceled"].includes(normalized)) return "cancelled";
  if (["processing", "approved"].includes(normalized)) return "processing";

  return "pending";
}

export async function POST(request: Request) {
  const authError = validateAdminSecret(request.headers);
  if (authError) return authError;

  try {
    const client = requireSanityWriteClient();
    const orders = await client.fetch<SanityOrder[]>(
      `*[
        _type == "order" &&
        adminStatus == "approved" &&
        defined(clickomSaleId) &&
        !(status in $terminalStatuses)
      ]{_id, status}`,
      { terminalStatuses: Array.from(terminalStatuses) },
    );

    const failures: Array<{ orderId: string; error: string }> = [];
    let synced = 0;

    for (const order of orders) {
      try {
        const clickomStatus = await getClickomSaleStatus(order._id);
        await client.patch(order._id).set({ status: normalizeClickomStatus(clickomStatus) }).commit();
        synced += 1;
      } catch (error) {
        failures.push({
          orderId: order._id,
          error: error instanceof Error ? error.message : "Unknown sync error.",
        });
      }
    }

    return Response.json({ ok: true, synced, failures });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync order statuses.";
    return Response.json({ error: message }, { status: 400 });
  }
}
