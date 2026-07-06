import "server-only";

import { renderEmailLayout, renderEyebrow, renderHeading, renderParagraph, renderSummaryRow } from "./layout";

export type LeadSource = "newsletter" | "inquiry" | "suggestion";
export type SuggestionType = "general" | "design";

export interface LeadSubmissionEmailParams {
  source: LeadSource;
  name?: string;
  email: string;
  phone?: string;
  subject?: string;
  message?: string;
  suggestionType?: SuggestionType;
  attachmentNames?: string[];
}

const SOURCE_LABEL: Record<LeadSource, string> = {
  newsletter: "Newsletter Signup",
  inquiry: "Customer Inquiry",
  suggestion: "Suggestion / Feedback",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSubject(params: LeadSubmissionEmailParams) {
  if (params.source === "newsletter") return `New newsletter signup — ${params.email}`;
  return `New ${SOURCE_LABEL[params.source]} — ${params.subject || params.email}`;
}

export function renderLeadSubmissionAdminEmail(params: LeadSubmissionEmailParams): { subject: string; html: string } {
  const bodyHtml = `
    ${renderEyebrow(SOURCE_LABEL[params.source])}
    ${renderHeading(params.subject || SOURCE_LABEL[params.source])}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
      ${renderSummaryRow("Source", SOURCE_LABEL[params.source])}
      ${params.name ? renderSummaryRow("Name", params.name) : ""}
      ${renderSummaryRow("Email", params.email)}
      ${params.phone ? renderSummaryRow("Phone", params.phone) : ""}
      ${params.suggestionType ? renderSummaryRow("Suggestion Type", params.suggestionType === "design" ? "Design specific" : "General") : ""}
      ${params.attachmentNames?.length ? renderSummaryRow("Attachments", params.attachmentNames.join(", ")) : ""}
    </table>

    ${params.message ? renderParagraph(`<strong>Message:</strong> ${escapeHtml(params.message)}`) : renderParagraph("No message was included.")}
  `;

  return {
    subject: formatSubject(params),
    html: renderEmailLayout({
      previewText: `New ${SOURCE_LABEL[params.source].toLowerCase()} from ${params.email}.`,
      bodyHtml,
    }),
  };
}

export function renderLeadSubmissionCustomerEmail(params: LeadSubmissionEmailParams): { subject: string; html: string } {
  const isNewsletter = params.source === "newsletter";
  const heading = isNewsletter
    ? "You're On The List"
    : `We've Received It${params.name ? `, ${params.name.split(" ")[0]}` : ""}`;
  const message = isNewsletter
    ? "Thank you for joining Noora Modesty updates. We'll send curated collection news and important store updates to this email."
    : "Thank you for reaching out to Noora Modesty. Our team will review your message and get back to you soon.";

  const bodyHtml = `
    ${renderEyebrow(isNewsletter ? "Signup Confirmed" : "Message Received")}
    ${renderHeading(heading)}
    ${renderParagraph(message)}
  `;

  return {
    subject: isNewsletter ? "Welcome to Noora Modesty" : "We Received Your Message — Noora Modesty",
    html: renderEmailLayout({
      previewText: isNewsletter ? "You're now subscribed to Noora Modesty updates." : "Your message has been received.",
      bodyHtml,
    }),
  };
}
