import "server-only";

import { Resend } from "resend";
import { OrderCustomer, OrderItemSnapshot, PaymentMethod } from "@/types/order";

interface SendOrderConfirmationParams {
  orderNumber: string;
  customer: OrderCustomer;
  items: OrderItemSnapshot[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
}

export async function sendOrderConfirmationEmail(params: SendOrderConfirmationParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not configured. Skipping order confirmation email.");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const itemLines = params.items
    .map((item) => `${item.title} x ${item.quantity} - LKR ${(item.unitPrice * item.quantity).toLocaleString()}`)
    .join("<br />");

  await resend.emails.send({
    from: "Noora Modesty <orders@nooramodesty.com>",
    to: params.customer.email,
    subject: `Order confirmation ${params.orderNumber}`,
    html: `
      <div>
        <h1>Order ${params.orderNumber}</h1>
        <p>Please screenshot your order number for future reference.</p>
        <p>Payment method: ${params.paymentMethod === "cod" ? "Cash on Delivery" : "Bank Transfer"}</p>
        <p>${itemLines}</p>
        <p><strong>Total: LKR ${params.totalAmount.toLocaleString()}</strong></p>
      </div>
    `,
  });
}
