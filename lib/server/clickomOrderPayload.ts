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

function buildOrderItemNote(item: SanityOrder["items"][number]) {
  const lines = [
    item.selectedColor ? `Colour: ${item.selectedColor}` : "",
    item.selectedColorHex ? `Colour hex: ${item.selectedColorHex}` : "",
    item.selectedSize ? `Size: ${item.selectedSize}` : "",
  ];

  if (item.customSize) {
    lines.push("Custom size: Yes");
    if (item.customLength) lines.push(`Length: ${item.customLength}`);
    if (item.customBust) lines.push(`Bust: ${item.customBust}`);
    if (item.customHip) lines.push(`Hip: ${item.customHip}`);
    if (item.customSleeve) lines.push(`Sleeve: ${item.customSleeve}`);
    if (item.customNote) lines.push(`Note: ${item.customNote}`);
  }

  if (item.preOrder) {
    lines.push("Pre-order: Yes");
  }

  return lines.filter(Boolean).join(" | ");
}

interface BuildClickomSalePayloadOptions {
  seedTotalPayment?: boolean;
}

export function buildClickomSalePayload(
  order: SanityOrder,
  status?: ClickomStatusCode,
  options: BuildClickomSalePayloadOptions = {},
): ClickomSalePayload {
  const clickomCustomOrderId = order.clickomCustomOrderId || buildClickomCustomOrderId(order.orderNumber);
  const paymentStatus = order.paymentStatus || "due";
  const paidAmount = Math.max(0, order.paidAmount || 0);
  const seedPaymentAmount = options.seedTotalPayment ? Math.max(0, order.totalAmount || 0) : 0;
  const clickomPaymentAmount = Math.max(paidAmount, seedPaymentAmount);
  const paymentMethod = paidAmount > 0 ? "bank_transfer" : "cash";
  const itemNotes = order.items
    .map((item) => {
      const itemNote = buildOrderItemNote(item);
      return itemNote ? `${item.title}: ${itemNote}` : "";
    })
    .filter(Boolean);

  const payload: ClickomSalePayload = {
    invoice_no: order.orderNumber,
    custom_order_id: clickomCustomOrderId,
    transaction_date: new Date().toISOString().slice(0, 10),
    mobile: order.customer.mobile,
    customer_full_name: order.customer.fullName,
    customer_address_line_1: order.customer.addressLine1,
    customer_address_line_2: order.customer.addressLine2,
    customer_city: order.customer.city,
    customer_zip_code: order.customer.district,
    customer_country: "Sri Lanka",
    discount_type: "fixed",
    discount_amount: order.discountAmount || 0,
    additional_notes: itemNotes.join("\n"),
    status,
    payment_status: paymentStatus,
    products: order.items.map((item) => {
      const itemNote = buildOrderItemNote(item);

      return {
        product_id: item.clickomProductId,
        variation_id: item.clickomVariationId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        unit_price_inc_tax: item.unitPrice,
        enable_stock: 1 as const,
        note: itemNote,
        sell_line_note: itemNote,
      };
    }),
  };

  if (clickomPaymentAmount > 0) {
    payload.payment = [
      {
        amount: clickomPaymentAmount,
        method: paymentMethod,
        note: options.seedTotalPayment
          ? "Clickom total seed via Noora Modesty"
          : "Verified bank transfer via Noora Modesty",
      },
    ];
  }

  return payload;
}
