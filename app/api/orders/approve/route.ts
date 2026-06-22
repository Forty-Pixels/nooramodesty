import { validateAdminSecret } from "@/lib/server/adminAuth";
import { createClickomOmsWebOrder } from "@/lib/server/clickomOmsWeb";
import { requireSanityWriteClient } from "@/lib/server/sanity";
import { SanityOrder } from "@/types/sanityOrder";
import { PaymentStatus } from "@/types/order";

export const runtime = "nodejs";

const paymentStatuses = new Set<PaymentStatus>(["due", "partial", "paid"]);

function resolvePayment(status: unknown, paidAmount: unknown, order: SanityOrder) {
  const paymentStatus = paymentStatuses.has(status as PaymentStatus)
    ? status as PaymentStatus
    : order.paymentStatus || "due";
  const totalAmount = Math.max(0, Number(order.totalAmount || 0));
  const inputPaidAmount = Math.max(0, Number(paidAmount ?? order.paidAmount ?? 0));
  const resolvedPaidAmount =
    paymentStatus === "paid"
      ? totalAmount
      : paymentStatus === "due"
        ? 0
        : inputPaidAmount;

  return {
    paymentStatus,
    paidAmount: resolvedPaidAmount,
    balanceAmount: Math.max(0, totalAmount - resolvedPaidAmount),
  };
}

export async function POST(request: Request) {
  const authError = validateAdminSecret(request.headers);
  if (authError) return authError;

  try {
    const { orderId, paymentStatus, paidAmount } = await request.json();

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
        discountAmount,
        paymentStatus,
        paidAmount,
        balanceAmount
      }`,
      { orderId },
    );

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.adminStatus !== "pending_approval" || order.clickomSaleId || order.clickomTransactionId) {
      return Response.json({ error: "Order cannot be approved." }, { status: 409 });
    }

    const resolvedPayment = resolvePayment(paymentStatus, paidAmount, order);
    const orderForClickom: SanityOrder = {
      ...order,
      paymentStatus: resolvedPayment.paymentStatus,
      paidAmount: resolvedPayment.paidAmount,
      balanceAmount: resolvedPayment.balanceAmount,
    };
    const clickomSale = await createClickomOmsWebOrder(orderForClickom);
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
        paymentStatus: resolvedPayment.paymentStatus,
        paidAmount: resolvedPayment.paidAmount,
        balanceAmount: resolvedPayment.balanceAmount,
        paymentVerifiedAt: resolvedPayment.paymentStatus === "due" ? null : approvedAt,
        approvedAt,
      })
      .commit();

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
