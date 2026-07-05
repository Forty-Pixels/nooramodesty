import { validateAdminSecret } from "@/lib/server/adminAuth";
import { sendOrderRejectedEmail } from "@/lib/server/email";
import { requireSanityWriteClient } from "@/lib/server/sanity";
import { SanityOrder } from "@/types/sanityOrder";

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
    const order = await client.fetch<SanityOrder | null>(
      `*[_type == "order" && _id == $orderId][0]{ _id, orderNumber, customer }`,
      { orderId },
    );

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    await client.patch(orderId).set({ adminStatus: "rejected" }).commit();

    try {
      await sendOrderRejectedEmail({ orderNumber: order.orderNumber, customer: order.customer });
    } catch (emailError) {
      console.warn("Order rejected, but rejection email failed.", emailError);
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reject order.";
    return Response.json({ error: message }, { status: 400 });
  }
}
