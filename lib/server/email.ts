import "server-only";

import { Resend } from "resend";
import { OrderCustomer, OrderItemSnapshot, PaymentMethod, PaymentStatus } from "@/types/order";
import { PublicSiteSettings } from "@/types/siteSettings";
import { renderOrderApprovedEmail } from "./emailTemplates/orderApproved";
import { renderOrderConfirmationEmail } from "./emailTemplates/orderConfirmation";
import { renderOrderRejectedEmail } from "./emailTemplates/orderRejected";
import {
  LeadSubmissionEmailParams,
  renderLeadSubmissionAdminEmail,
  renderLeadSubmissionCustomerEmail,
} from "./emailTemplates/leadSubmission";
import {
  ReturnExchangeRequestEmailParams,
  renderReturnExchangeAdminEmail,
  renderReturnExchangeCustomerEmail,
} from "./emailTemplates/returnExchangeRequest";

const FROM_ADDRESS = process.env.EMAIL_FROM || "Noora Modesty <orders@nooramodesty.com>";
const ADMIN_EMAIL = process.env.EMAIL_ADMIN_TO || "hello@nooramodesty.com";

async function sendEmail(params: { to: string; subject: string; html: string }): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`RESEND_API_KEY is not configured. Skipping email "${params.subject}" to ${params.to}.`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });
}

interface SendOrderConfirmationParams {
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

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams): Promise<void> {
  if (!params.customer.email) {
    console.warn(`Customer email is missing. Skipping confirmation email for ${params.orderNumber}.`);
    return;
  }

  const { subject, html } = renderOrderConfirmationEmail(params);
  await sendEmail({ to: params.customer.email, subject, html });
}

interface SendOrderApprovedParams {
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItemSnapshot[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
}

export async function sendOrderApprovedEmail(params: SendOrderApprovedParams): Promise<void> {
  if (!params.customer.email) {
    console.warn(`Customer email is missing. Skipping approval email for ${params.orderNumber}.`);
    return;
  }

  const { subject, html } = renderOrderApprovedEmail(params);
  await sendEmail({ to: params.customer.email, subject, html });
}

interface SendOrderRejectedParams {
  orderNumber: string;
  customer: OrderCustomer;
}

export async function sendOrderRejectedEmail(params: SendOrderRejectedParams): Promise<void> {
  if (!params.customer.email) {
    console.warn(`Customer email is missing. Skipping rejection email for ${params.orderNumber}.`);
    return;
  }

  const { subject, html } = renderOrderRejectedEmail(params);
  await sendEmail({ to: params.customer.email, subject, html });
}

export async function sendReturnExchangeRequestEmails(
  params: ReturnExchangeRequestEmailParams & { customerEmail?: string },
): Promise<void> {
  const admin = renderReturnExchangeAdminEmail(params);
  await sendEmail({ to: ADMIN_EMAIL, subject: admin.subject, html: admin.html });

  if (params.customerEmail) {
    const customer = renderReturnExchangeCustomerEmail(params);
    await sendEmail({ to: params.customerEmail, subject: customer.subject, html: customer.html });
  }
}

export async function sendLeadSubmissionEmails(params: LeadSubmissionEmailParams): Promise<void> {
  const admin = renderLeadSubmissionAdminEmail(params);
  await sendEmail({ to: ADMIN_EMAIL, subject: admin.subject, html: admin.html });

  const customer = renderLeadSubmissionCustomerEmail(params);
  await sendEmail({ to: params.email, subject: customer.subject, html: customer.html });
}
