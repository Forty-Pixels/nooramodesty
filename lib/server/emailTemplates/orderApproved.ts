import "server-only";

import { OrderCustomer, OrderItemSnapshot } from "@/types/order";
import {
  EMAIL_COLORS,
  EmailLineItem,
  SITE_URL,
  renderButton,
  renderEmailLayout,
  renderEyebrow,
  renderHeading,
  renderItemRows,
  renderParagraph,
  renderStatusPill,
  renderSummaryRow,
} from "./layout";

export interface OrderApprovedEmailParams {
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItemSnapshot[];
  totalAmount: number;
}

function toLineItems(items: OrderItemSnapshot[]): EmailLineItem[] {
  return items.map((item) => ({
    title: item.title,
    variant: [item.selectedColor, item.size].filter(Boolean).join(" / "),
    quantity: item.quantity,
    lineTotal: item.unitPrice * item.quantity,
  }));
}

export function renderOrderApprovedEmail(params: OrderApprovedEmailParams): { subject: string; html: string } {
  const trackingUrl = `${SITE_URL}/order-tracking?orderNumber=${encodeURIComponent(params.orderNumber)}`;

  const bodyHtml = `
    ${renderEyebrow("Order Approved")}
    ${renderHeading(`Your Order Is Confirmed, ${params.customer.fullName.split(" ")[0] || "there"}`)}
    ${renderParagraph(`Good news — order <strong>${params.orderNumber}</strong> has been approved and is now being processed for dispatch.`)}

    <div style="margin:16px 0 24px;">
      ${renderStatusPill("Approved", EMAIL_COLORS.success)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${renderItemRows(toLineItems(params.items))}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;padding-top:16px;border-top:1px solid ${EMAIL_COLORS.border};">
      ${renderSummaryRow("Total", `LKR ${params.totalAmount.toLocaleString()}`, { bold: true })}
    </table>

    ${renderParagraph(`You can track your order anytime at <strong>${SITE_URL}/order-tracking</strong> using your order number and the phone number on your order. Once your parcel is dispatched, your courier tracking link will appear there.`)}

    <div style="margin-top:32px;">
      ${renderButton("Track Your Order", trackingUrl)}
    </div>
  `;

  return {
    subject: `Order Approved — ${params.orderNumber}`,
    html: renderEmailLayout({
      previewText: `Your Noora Modesty order ${params.orderNumber} has been approved.`,
      bodyHtml,
    }),
  };
}
