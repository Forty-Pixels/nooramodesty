import { validateAdminSecret } from "@/lib/server/adminAuth";
import { ClickomStatusCode, setClickomSaleStatus } from "@/lib/server/clickom";
import { buildClickomSalePayload } from "@/lib/server/clickomOrderPayload";
import { requireSanityWriteClient } from "@/lib/server/sanity";
import { OrderStatus } from "@/types/order";
import { SanityOrder } from "@/types/sanityOrder";

export const runtime = "nodejs";

const clickomStatusByOrderStatus: Record<OrderStatus, ClickomStatusCode> = {
  pending: "pd",
  confirmed: "pc",
  processing: "pc",
  dispatched: "sp",
  shipped: "sp",
  completed: "cp",
  cancelled: "cn",
};

function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && value in clickomStatusByOrderStatus;
}

export async function POST(request: Request) {
  const authError = validateAdminSecret(request.headers);
  if (authError) return authError;

  try {
    const { orderId, status } = await request.json();

    if (typeof orderId !== "string" || !orderId) {
      return Response.json({ error: "Order ID is required." }, { status: 400 });
    }

    if (!isOrderStatus(status)) {
      return Response.json({ error: "Valid order status is required." }, { status: 400 });
    }

    const client = requireSanityWriteClient();
    const order = await client.fetch<SanityOrder | null>(
      `*[_type == "order" && _id == $orderId][0]{
        _id,
        orderNumber,
        customer,
        items,
        paymentMethod,
        adminStatus,
        status,
        clickomSaleId,
        clickomTransactionId,
        clickomCustomOrderId,
        totalAmount,
        discountAmount
      }`,
      { orderId },
    );

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.adminStatus !== "approved" || !order.clickomCustomOrderId || (!order.clickomSaleId && !order.clickomTransactionId)) {
      return Response.json({ error: "Only approved Clickom orders can be updated." }, { status: 409 });
    }

    const clickomStatus = clickomStatusByOrderStatus[status];
    await setClickomSaleStatus(buildClickomSalePayload(order, clickomStatus), clickomStatus);
    await client.patch(order._id).set({ status }).commit();

    return Response.json({ ok: true, status, clickomStatus });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update order status.";
    return Response.json({ error: message }, { status: 400 });
  }
}
