import { ZodError } from "zod";
import { sendOrderConfirmationEmail } from "@/lib/server/email";
import { generateOrderNumber } from "@/lib/server/orderNumber";
import {
  buildOrderItems,
  calculateTotals,
  findCoupon,
  parseCheckoutPayload,
} from "@/lib/server/orderValidation";
import { requireSanityWriteClient } from "@/lib/server/sanity";
import { CheckoutOrderPayload } from "@/types/order";

export const runtime = "nodejs";

const MAX_SLIP_SIZE = 5 * 1024 * 1024;
const ALLOWED_SLIP_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

function parsePayload(value: FormDataEntryValue | null): CheckoutOrderPayload {
  if (typeof value !== "string") {
    throw new Error("Order payload is required.");
  }

  return parseCheckoutPayload(JSON.parse(value));
}

function validateSlip(file: FormDataEntryValue | null): File | null {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  if (!ALLOWED_SLIP_TYPES.has(file.type)) {
    throw new Error("Payment slip must be a JPEG, PNG, WEBP, or PDF file.");
  }

  if (file.size > MAX_SLIP_SIZE) {
    throw new Error("Payment slip must be 5MB or smaller.");
  }

  return file;
}

export async function POST(request: Request) {
  try {
    const client = requireSanityWriteClient();
    const formData = await request.formData();
    const payload = parsePayload(formData.get("payload"));
    const paymentSlip = validateSlip(formData.get("paymentSlip"));

    const items = await buildOrderItems(payload.items);
    const coupon = await findCoupon(payload.couponCode);
    const totals = calculateTotals(items, coupon);
    const orderNumber = await generateOrderNumber();
    const placedAt = new Date().toISOString();

    let paymentSlipReference: { _type: "file"; asset: { _type: "reference"; _ref: string } } | undefined;
    let paymentSlipUploadedAt: string | undefined;
    let paymentSlipUrl: string | undefined;

    if (paymentSlip) {
      const asset = await client.assets.upload("file", paymentSlip, {
        filename: paymentSlip.name,
        contentType: paymentSlip.type,
      });

      paymentSlipReference = {
        _type: "file",
        asset: {
          _type: "reference",
          _ref: asset._id,
        },
      };
      paymentSlipUploadedAt = placedAt;
      paymentSlipUrl = asset.url;
    }

    const order = await client.create({
      _type: "order",
      orderNumber,
      customer: payload.customer,
      items: items.map((item) => ({ _key: crypto.randomUUID(), ...item })),
      paymentMethod: payload.paymentMethod,
      paymentSlip: paymentSlipReference,
      paymentSlipUrl,
      paymentSlipUploadedAt,
      adminStatus: "pending_approval",
      status: "pending",
      placedAt,
      couponCode: coupon?.code,
      discountAmount: totals.discountAmount,
      totalAmount: totals.totalAmount,
    });

    if (coupon?._id) {
      await client.patch(coupon._id).setIfMissing({ usesCount: 0 }).inc({ usesCount: 1 }).commit();
    }

    try {
      await sendOrderConfirmationEmail({
        orderNumber,
        customer: payload.customer,
        items,
        totalAmount: totals.totalAmount,
        paymentMethod: payload.paymentMethod,
      });
    } catch (emailError) {
      console.warn("Order created, but confirmation email failed.", emailError);
    }

    return Response.json({
      orderNumber,
      orderId: order._id,
    });
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "Invalid order details."
        : error instanceof Error
          ? error.message
          : "Unable to create order.";

    return Response.json({ error: message }, { status: 400 });
  }
}
