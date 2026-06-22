import { validateAdminSecret } from "@/lib/server/adminAuth";
import { requireSanityWriteClient } from "@/lib/server/sanity";
import { PaymentStatus } from "@/types/order";

export const runtime = "nodejs";

const paymentStatuses = new Set<PaymentStatus>(["due", "partial", "paid"]);

export async function POST(request: Request) {
  const authError = validateAdminSecret(request.headers);
  if (authError) return authError;

  try {
    const { orderId, paymentStatus, paidAmount, totalAmount } = await request.json();

    if (typeof orderId !== "string" || !orderId) {
      return Response.json({ error: "Order ID is required." }, { status: 400 });
    }

    if (!paymentStatuses.has(paymentStatus)) {
      return Response.json({ error: "Valid payment status is required." }, { status: 400 });
    }

    const numericTotalAmount = Math.max(0, Number(totalAmount || 0));
    const inputPaidAmount = Math.max(0, Number(paidAmount || 0));
    const numericPaidAmount =
      paymentStatus === "paid"
        ? numericTotalAmount
        : paymentStatus === "due"
          ? 0
          : inputPaidAmount;
    const balanceAmount = Math.max(0, numericTotalAmount - numericPaidAmount);
    const client = requireSanityWriteClient();

    await client
      .patch(orderId)
      .set({
        paymentStatus,
        paidAmount: numericPaidAmount,
        balanceAmount,
        paymentVerifiedAt: paymentStatus === "due" ? null : new Date().toISOString(),
      })
      .commit();

    return Response.json({ ok: true, paymentStatus, paidAmount: numericPaidAmount, balanceAmount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update payment.";
    return Response.json({ error: message }, { status: 400 });
  }
}
