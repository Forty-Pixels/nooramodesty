import { validateAdminSecret } from "@/lib/server/adminAuth";
import { getLiveClickomStock } from "@/lib/server/clickom";
import { createClickomOmsWebOrder } from "@/lib/server/clickomOmsWeb";
import { sendOrderApprovedEmail } from "@/lib/server/email";
import { requireSanityWriteClient } from "@/lib/server/sanity";
import { SanityOrder } from "@/types/sanityOrder";

export const runtime = "nodejs";

// Stock was checked when the order was placed, but an order can sit in
// pending_approval for days — by approval time the stock may be long gone.
// Re-check against live Clickom before committing the sale.
async function findInsufficientStock(order: SanityOrder): Promise<string[]> {
  const requestedByVariation = new Map<number, { quantity: number; label: string }>();

  for (const item of order.items || []) {
    if (item.preOrder || item.customSize || !item.clickomVariationId) continue;

    const existing = requestedByVariation.get(item.clickomVariationId);
    const label = `${item.title}${item.size || item.selectedSize ? ` (${item.size || item.selectedSize})` : ""}`;

    requestedByVariation.set(item.clickomVariationId, {
      quantity: (existing?.quantity || 0) + item.quantity,
      label: existing?.label || label,
    });
  }

  const shortages = await Promise.all(
    [...requestedByVariation].map(async ([variationId, { quantity, label }]) => {
      const stock = await getLiveClickomStock(String(variationId));
      if (stock.stock >= quantity) return null;
      return `${label}: ${quantity} ordered, only ${Math.max(0, stock.stock)} in stock.`;
    }),
  );

  return shortages.filter((shortage): shortage is string => shortage !== null);
}

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

    if (order.adminStatus !== "pending_approval" || order.clickomSaleId || order.clickomTransactionId) {
      return Response.json({ error: "Order cannot be approved." }, { status: 409 });
    }

    const shortages = await findInsufficientStock(order);

    if (shortages.length > 0) {
      return Response.json(
        { error: `Not enough stock to approve this order. ${shortages.join(" ")}`, shortages },
        { status: 409 },
      );
    }

    const clickomSale = await createClickomOmsWebOrder(order);
    const approvedAt = new Date().toISOString();

    await client
      .patch(order._id)
      .set({
        clickomCustomOrderId: clickomSale.customOrderId,
        clickomSaleId: clickomSale.transactionId,
        clickomTransactionId: clickomSale.transactionId,
        clickomInvoiceNo: clickomSale.invoiceNo,
        adminStatus: "approved",
        status: "pending",
        approvedAt,
      })
      .commit();

    try {
      await sendOrderApprovedEmail({
        orderNumber: order.orderNumber,
        customer: order.customer,
        items: order.items,
        totalAmount: order.totalAmount,
      });
    } catch (emailError) {
      console.warn("Order approved, but approval email failed.", emailError);
    }

    return Response.json({
      ok: true,
      clickomTransactionId: clickomSale.transactionId,
      clickomInvoiceNo: clickomSale.invoiceNo,
      approvedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve order.";
    return Response.json({ error: message }, { status: 400 });
  }
}
