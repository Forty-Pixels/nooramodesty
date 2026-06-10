import { ZodError } from "zod";
import {
  buildOrderItems,
  calculateTotals,
  couponValidationSchema,
  findCoupon,
  formatCheckoutValidationErrors,
} from "@/lib/server/orderValidation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = couponValidationSchema.parse(await request.json());
    const items = await buildOrderItems(payload.items);
    const coupon = await findCoupon(payload.couponCode);

    if (!coupon) {
      return Response.json({ valid: false, message: "Invalid coupon.", discountAmount: 0 });
    }

    const totals = calculateTotals(items, coupon);

    return Response.json({
      valid: true,
      code: coupon.code,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
      message: "Coupon applied.",
    });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? formatCheckoutValidationErrors(error)[0]
        : error instanceof Error
          ? error.message
          : "Unable to validate coupon.";

    return Response.json({ valid: false, message, discountAmount: 0 }, { status: 400 });
  }
}
