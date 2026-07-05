import "server-only";

import { renderEmailLayout, renderEyebrow, renderHeading, renderParagraph, renderSummaryRow } from "./layout";

export interface ReturnExchangeRequestEmailParams {
  requestType: "return" | "exchange";
  orderNumber: string;
  customerName: string;
  phone: string;
  reason: string;
  details: string;
}

export function renderReturnExchangeCustomerEmail(params: ReturnExchangeRequestEmailParams): { subject: string; html: string } {
  const label = params.requestType === "return" ? "Return" : "Exchange";

  const bodyHtml = `
    ${renderEyebrow(`${label} Request Received`)}
    ${renderHeading(`We've Got Your Request, ${params.customerName.split(" ")[0] || "there"}`)}
    ${renderParagraph(`Your ${label.toLowerCase()} request for order <strong>${params.orderNumber}</strong> has been received. Our team will review the details and contact you within 24-48 hours.`)}
  `;

  return {
    subject: `${label} Request Received — ${params.orderNumber}`,
    html: renderEmailLayout({
      previewText: `Your ${label.toLowerCase()} request for order ${params.orderNumber} has been received.`,
      bodyHtml,
    }),
  };
}

export function renderReturnExchangeAdminEmail(params: ReturnExchangeRequestEmailParams): { subject: string; html: string } {
  const label = params.requestType === "return" ? "Return" : "Exchange";

  const bodyHtml = `
    ${renderEyebrow(`New ${label} Request`)}
    ${renderHeading(`${label} Request — ${params.orderNumber}`)}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${renderSummaryRow("Customer", params.customerName)}
      ${renderSummaryRow("Phone", params.phone)}
      ${renderSummaryRow("Order Number", params.orderNumber)}
      ${renderSummaryRow("Reason", params.reason)}
    </table>

    ${renderParagraph(`<strong>Details:</strong> ${params.details}`)}
  `;

  return {
    subject: `New ${label} Request — ${params.orderNumber}`,
    html: renderEmailLayout({
      previewText: `New ${label.toLowerCase()} request for order ${params.orderNumber}.`,
      bodyHtml,
    }),
  };
}
