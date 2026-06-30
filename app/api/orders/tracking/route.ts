import { getClickomSaleStatusDetails } from "@/lib/server/clickom";
import { sanityClient } from "@/lib/sanity/client";
import { SanityOrder } from "@/types/sanityOrder";

export const runtime = "nodejs";

const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;

function isValidPhone(value: string) {
  const digitCount = value.replace(/\D/g, "").length;
  return PHONE_PATTERN.test(value) && digitCount >= 7 && digitCount <= 15;
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function cityPakTrackingUrl(waybillNumber: string) {
  return `https://www.citypak.lk/track/${encodeURIComponent(waybillNumber)}`;
}

export async function POST(request: Request) {
  try {
    if (!sanityClient) {
      return Response.json({ error: "Sanity is not configured." }, { status: 500 });
    }

    const { orderNumber, mobile } = await request.json();

    if (typeof orderNumber !== "string" || !orderNumber.trim()) {
      return Response.json({ error: "Order number is required." }, { status: 400 });
    }

    if (typeof mobile !== "string" || !mobile.trim()) {
      return Response.json({ error: "Phone number is required." }, { status: 400 });
    }

    if (!isValidPhone(mobile.trim())) {
      return Response.json({ error: "Phone number must contain 7 to 15 digits and no letters." }, { status: 400 });
    }

    const order = await sanityClient.fetch<SanityOrder | null>(
      `*[_type == "order" && orderNumber == $orderNumber][0]{
        _id,
        orderNumber,
        customer,
        items,
        paymentMethod,
        paymentStatus,
        paidAmount,
        balanceAmount,
        adminStatus,
        status,
        clickomCustomOrderId,
        clickomInvoiceNo,
        waybillNumber,
        courierStatus,
        placedAt,
        totalAmount,
        paymentSlipUrl
      }`,
      { orderNumber: orderNumber.trim() },
      { next: { revalidate: 0 } },
    );

    if (!order || normalizePhone(order.customer?.mobile || "") !== normalizePhone(mobile)) {
      return Response.json({ error: "No matching order found." }, { status: 404 });
    }

    let clickomStatus: Awaited<ReturnType<typeof getClickomSaleStatusDetails>> | null = null;

    if (order.clickomCustomOrderId) {
      try {
        clickomStatus = await getClickomSaleStatusDetails(String(order.clickomCustomOrderId));
      } catch {
        clickomStatus = null;
      }
    }

    const waybillNumber = clickomStatus?.waybillNumber || order.waybillNumber;

    return Response.json({
      order: {
        orderNumber: order.orderNumber,
        invoiceNo: order.clickomInvoiceNo || order.orderNumber,
        placedAt: order.placedAt,
        adminStatus: order.adminStatus,
        status: order.status,
        clickomStatus: clickomStatus?.status,
        callStatus: clickomStatus?.callStatus,
        orderStatus: clickomStatus?.orderStatus,
        courierStatus: clickomStatus?.shippingStatus || order.courierStatus,
        paymentStatus: clickomStatus?.paymentStatus || order.paymentStatus,
        waybillNumber,
        cityPakTrackingUrl: waybillNumber ? cityPakTrackingUrl(waybillNumber) : undefined,
        totalAmount: order.totalAmount,
        paidAmount: order.paidAmount || 0,
        balanceAmount: order.balanceAmount ?? order.totalAmount,
        items: order.items,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to track order.";
    return Response.json({ error: message }, { status: 400 });
  }
}
