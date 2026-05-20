import { validateAdminSecret } from "@/lib/server/adminAuth";
import { requireSanityWriteClient } from "@/lib/server/sanity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authError = validateAdminSecret(request.headers);
  if (authError) return authError;

  try {
    const { orderId } = await request.json();

    if (typeof orderId !== "string" || !orderId) {
      return Response.json({ error: "Order ID is required." }, { status: 400 });
    }

    const client = requireSanityWriteClient();
    await client.patch(orderId).set({ adminStatus: "rejected" }).commit();

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reject order.";
    return Response.json({ error: message }, { status: 400 });
  }
}
