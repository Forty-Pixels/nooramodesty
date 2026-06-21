import "server-only";

import { ClickomSalePayload, ClickomStatusCode } from "@/lib/server/clickom";
import { SanityOrder } from "@/types/sanityOrder";

export function buildClickomCustomOrderId(orderNumber: string) {
  const match = orderNumber.match(/(\d{8})-(\d{4})$/);

  if (match) {
    return Number(`${match[1].slice(3)}${match[2]}`);
  }

  return 100000000 + (Date.now() % 900000000);
}

export function buildClickomSalePayload(order: SanityOrder, status?: ClickomStatusCode): ClickomSalePayload {
  const clickomCustomOrderId = order.clickomCustomOrderId || buildClickomCustomOrderId(order.orderNumber);

  return {
    invoice_no: order.orderNumber,
    custom_order_id: clickomCustomOrderId,
    transaction_date: new Date().toISOString().slice(0, 10),
    mobile: order.customer.mobile,
    customer_full_name: order.customer.fullName,
    customer_address_line_1: order.customer.addressLine1,
    customer_address_line_2: order.customer.addressLine2,
    customer_city: order.customer.city,
    customer_zip_code: order.customer.zipCode,
    customer_country: "Sri Lanka",
    discount_type: "fixed",
    discount_amount: order.discountAmount || 0,
    status,
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
        note: order.paymentMethod === "cod" ? "COD order via Noora Modesty" : "Bank transfer order via Noora Modesty",
      },
    ],
  };
}
