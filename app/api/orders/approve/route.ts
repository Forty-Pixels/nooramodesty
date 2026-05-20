import { validateAdminSecret } from "@/lib/server/adminAuth";
import { createClickomSale, ClickomSalePayload } from "@/lib/server/clickom";
import { requireSanityWriteClient } from "@/lib/server/sanity";
import { SanityOrder } from "@/types/sanityOrder";

export const runtime = "nodejs";

function buildSalePayload(order: SanityOrder): ClickomSalePayload {
  return {
    invoice_no: order.orderNumber,
    custom_order_id: order._id,
    mobile: order.customer.mobile,
    customer_full_name: order.customer.fullName,
    customer_address_line_1: order.customer.addressLine1,
    customer_address_line_2: order.customer.addressLine2,
    customer_city: order.customer.city,
    customer_zip_code: order.customer.zipCode,
    customer_country: "Sri Lanka",
    products: order.items.map((item) => ({
      product_id: item.clickomProductId,
      variation_id: item.clickomVariationId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      unit_price_inc_tax: item.unitPrice,
      enable_stock: 0,
    })),
    payment: [
      {
        amount: order.totalAmount,
        method: order.paymentMethod === "cod" ? "cash" : "bank_transfer",
      },
    ],
  };
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
        totalAmount
      }`,
      { orderId },
    );

    if (!order) {
      return Response.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.adminStatus !== "pending_approval" || order.clickomSaleId) {
      return Response.json({ error: "Order cannot be approved." }, { status: 409 });
    }

    const clickomSale = await createClickomSale(buildSalePayload(order));
    const approvedAt = new Date().toISOString();

    await client
      .patch(order._id)
      .set({
        clickomSaleId: clickomSale.saleId,
        adminStatus: "approved",
        approvedAt,
      })
      .commit();

    return Response.json({ ok: true, clickomSaleId: clickomSale.saleId, approvedAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to approve order.";
    return Response.json({ error: message }, { status: 400 });
  }
}
