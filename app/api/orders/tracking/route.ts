import { getClickomSaleStatusDetails } from "@/lib/server/clickom";
import { ClickomOmsTracking, getClickomOmsTracking } from "@/lib/server/clickomOmsWeb";
import { sanityClient } from "@/lib/sanity/client";
import { SanityOrder } from "@/types/sanityOrder";
import { normalizeOrderNumber, sriLankaMobileKey, validateOrderNumber } from "@/utils/formValidation";

export const runtime = "nodejs";

// Scraping the OMS list means a full web login per lookup, so cache briefly. Tracking is
// user-triggered and a shopper refreshing the page shouldn't re-run the login handshake each time.
const OMS_TRACKING_TTL_MS = 60 * 1000;
const omsTrackingCache = new Map<string, { result: ClickomOmsTracking | null; expiresAt: number }>();

async function loadOmsTracking(invoiceNo: string): Promise<ClickomOmsTracking | null> {
  const cached = omsTrackingCache.get(invoiceNo);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  try {
    const result = await getClickomOmsTracking(invoiceNo);
    omsTrackingCache.set(invoiceNo, { result, expiresAt: Date.now() + OMS_TRACKING_TTL_MS });
    return result;
  } catch {
    return cached?.result ?? null;
  }
}

function cityPakTrackingUrl(waybillNumber: string) {
  return `https://track.citypak.lk/track?tracking_number=${encodeURIComponent(waybillNumber)}`;
}

export async function POST(request: Request) {
  try {
    if (!sanityClient) {
      return Response.json({ error: "Sanity is not configured." }, { status: 500 });
    }

    const { orderNumber, mobile } = await request.json();

    const orderNumberErrors = typeof orderNumber === "string" ? validateOrderNumber(orderNumber) : ["Order number is required."];
    if (orderNumberErrors.length > 0) {
      return Response.json({ error: orderNumberErrors[0] }, { status: 400 });
    }

    const mobileKey = typeof mobile === "string" ? sriLankaMobileKey(mobile) : "";
    if (mobileKey.length !== 9) {
      return Response.json({ error: "Enter the 9-digit phone number registered on the order." }, { status: 400 });
    }

    const normalizedOrderNumber = normalizeOrderNumber(orderNumber as string);

    const order = await sanityClient.fetch<SanityOrder | null>(
      `*[_type == "order" && orderNumber == $orderNumber][0]{
        _id,
        orderNumber,
        customer,
        items,
        paymentMethod,
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
      { orderNumber: normalizedOrderNumber },
      { next: { revalidate: 0 } },
    );

    if (!order || sriLankaMobileKey(order.customer?.mobile || "") !== mobileKey) {
      return Response.json({ error: "No matching order found." }, { status: 404 });
    }

    // Primary source: the OMS order list, which is where the Citypak waybill actually surfaces.
    const omsTracking = await loadOmsTracking(order.clickomInvoiceNo || order.orderNumber);

    // Fallback only when the OMS scrape yielded no waybill — the REST sales_status endpoint does
    // not index web-created orders, so it's a last resort rather than the primary read.
    let clickomStatus: Awaited<ReturnType<typeof getClickomSaleStatusDetails>> | null = null;
    if (!omsTracking?.waybillNumber && order.clickomCustomOrderId) {
      try {
        clickomStatus = await getClickomSaleStatusDetails(String(order.clickomCustomOrderId));
      } catch {
        clickomStatus = null;
      }
    }

    const waybillNumber = omsTracking?.waybillNumber || clickomStatus?.waybillNumber || order.waybillNumber;

    return Response.json({
      order: {
        orderNumber: order.orderNumber,
        invoiceNo: order.clickomInvoiceNo || order.orderNumber,
        placedAt: order.placedAt,
        adminStatus: order.adminStatus,
        status: order.status,
        clickomStatus: clickomStatus?.status,
        callStatus: omsTracking?.callStatus || clickomStatus?.callStatus,
        orderStatus: clickomStatus?.orderStatus,
        courierStatus: omsTracking?.deliveryStatus || clickomStatus?.shippingStatus || order.courierStatus,
        waybillNumber,
        cityPakTrackingUrl: waybillNumber ? cityPakTrackingUrl(waybillNumber) : undefined,
        totalAmount: order.totalAmount,
        items: order.items,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to track order.";
    return Response.json({ error: message }, { status: 400 });
  }
}
