import "server-only";

import { OrderCustomer, OrderItemSnapshot, PaymentMethod } from "@/types/order";
import { PublicSiteSettings } from "@/types/siteSettings";
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
  renderSummaryRow,
} from "./layout";

export interface OrderConfirmationEmailParams {
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItemSnapshot[];
  subtotal: number;
  shipping: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  siteSettings: PublicSiteSettings;
}

function toLineItems(items: OrderItemSnapshot[]): EmailLineItem[] {
  return items.map((item) => ({
    title: item.title,
    variant: [item.selectedColor, item.size].filter(Boolean).join(" / "),
    quantity: item.quantity,
    lineTotal: item.unitPrice * item.quantity,
  }));
}

export function renderOrderConfirmationEmail(params: OrderConfirmationEmailParams): { subject: string; html: string } {
  const trackingUrl = `${SITE_URL}/order-tracking?orderNumber=${encodeURIComponent(params.orderNumber)}`;
  const whatsappDigits = params.siteSettings.whatsappNumber?.replace(/\D/g, "");
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hi Noora Modesty, I have a question about order ${params.orderNumber}.`)}`
    : undefined;

  const bankTransferSection =
    params.paymentMethod === "bank_transfer"
      ? `
    <div style="margin:24px 0;padding:20px;background-color:${EMAIL_COLORS.background};border:1px solid ${EMAIL_COLORS.border};">
      <p style="margin:0 0 10px;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${EMAIL_COLORS.ink};">Bank Transfer Details</p>
      ${params.siteSettings.bankName ? `<p style="margin:0 0 4px;font-size:12px;color:#4a4a4a;">Bank: ${params.siteSettings.bankName}</p>` : ""}
      ${params.siteSettings.bankAccountName ? `<p style="margin:0 0 4px;font-size:12px;color:#4a4a4a;">Name: ${params.siteSettings.bankAccountName}</p>` : ""}
      ${params.siteSettings.bankAccountNumber ? `<p style="margin:0 0 4px;font-size:12px;color:#4a4a4a;">Account: ${params.siteSettings.bankAccountNumber}</p>` : ""}
      ${params.siteSettings.bankBranch ? `<p style="margin:0 0 4px;font-size:12px;color:#4a4a4a;">Branch: ${params.siteSettings.bankBranch}</p>` : ""}
      <p style="margin:10px 0 0;font-size:11px;color:${EMAIL_COLORS.muted};">
        Please send your payment slip within ${params.siteSettings.bankTransferDeadlineDays} day${params.siteSettings.bankTransferDeadlineDays === 1 ? "" : "s"}. Orders without a slip by then are converted to Cash on Delivery automatically.
      </p>
    </div>`
      : "";

  const ctaButtons = [
    renderButton("Track Your Order", trackingUrl),
    whatsappUrl ? renderButton("Message Us On WhatsApp", whatsappUrl) : "",
  ]
    .filter(Boolean)
    .join(`<span style="display:inline-block;width:12px;"></span>`);

  const bodyHtml = `
    ${renderEyebrow("Order Confirmed")}
    ${renderHeading(`Thank You, ${params.customer.fullName.split(" ")[0] || "there"}`)}
    ${renderParagraph(`Your order <strong>${params.orderNumber}</strong> has been received and is being prepared. Please keep this order number for your records.`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      ${renderItemRows(toLineItems(params.items))}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;padding-top:16px;border-top:1px solid ${EMAIL_COLORS.border};">
      ${renderSummaryRow("Subtotal", `LKR ${params.subtotal.toLocaleString()}`)}
      ${renderSummaryRow("Shipping", params.shipping === 0 ? "Free" : `LKR ${params.shipping.toLocaleString()}`)}
      ${params.discountAmount > 0 ? renderSummaryRow("Discount", `- LKR ${params.discountAmount.toLocaleString()}`, { accent: EMAIL_COLORS.danger }) : ""}
      ${renderSummaryRow("Total", `LKR ${params.totalAmount.toLocaleString()}`, { bold: true })}
      ${renderSummaryRow("Payment Method", params.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer")}
    </table>

    ${bankTransferSection}

    <div style="margin-top:32px;">
      ${ctaButtons}
    </div>
  `;

  return {
    subject: `Order Confirmed — ${params.orderNumber}`,
    html: renderEmailLayout({
      previewText: `Your Noora Modesty order ${params.orderNumber} has been confirmed.`,
      bodyHtml,
    }),
  };
}
