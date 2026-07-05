import "server-only";

import { OrderCustomer } from "@/types/order";
import {
  EMAIL_COLORS,
  renderEmailLayout,
  renderEyebrow,
  renderHeading,
  renderParagraph,
  renderStatusPill,
} from "./layout";

export interface OrderRejectedEmailParams {
  orderNumber: string;
  customer: OrderCustomer;
}

export function renderOrderRejectedEmail(params: OrderRejectedEmailParams): { subject: string; html: string } {
  const bodyHtml = `
    ${renderEyebrow("Order Update")}
    ${renderHeading(`Order ${params.orderNumber} Was Cancelled`)}

    <div style="margin:16px 0 24px;">
      ${renderStatusPill("Cancelled", EMAIL_COLORS.danger)}
    </div>

    ${renderParagraph(`Hi ${params.customer.fullName.split(" ")[0] || "there"}, unfortunately we're unable to fulfil order <strong>${params.orderNumber}</strong>. No charges have been made against this order.`)}
    ${renderParagraph(`If you've already sent a bank transfer for this order, our team will reach out to arrange a refund. For any questions, please contact us at <a href="mailto:hello@nooramodesty.com" style="color:${EMAIL_COLORS.ink};">hello@nooramodesty.com</a>.`)}
  `;

  return {
    subject: `Order Cancelled — ${params.orderNumber}`,
    html: renderEmailLayout({
      previewText: `Your Noora Modesty order ${params.orderNumber} was cancelled.`,
      bodyHtml,
    }),
  };
}
