import { z, ZodError } from "zod";
import { sendReturnExchangeRequestEmails } from "@/lib/server/email";
import { requireSanityWriteClient } from "@/lib/server/sanity";

export const runtime = "nodejs";

const phonePattern = /^\+?[0-9\s().-]+$/;

const returnExchangeRequestSchema = z.object({
  requestType: z.enum(["return", "exchange"], { error: "Choose return or exchange." }),
  orderNumber: z.string({ error: "Order number is required." }).trim().min(1, { error: "Order number is required." }),
  customerName: z.string({ error: "Full name is required." }).trim().min(2, { error: "Full name must be at least 2 characters." }),
  phone: z.string({ error: "Phone number is required." }).trim().refine((value) => {
    const digitCount = value.replace(/\D/g, "").length;
    return phonePattern.test(value) && digitCount >= 7 && digitCount <= 15;
  }, { error: "Phone number must contain 7 to 15 digits and no letters." }),
  email: z.string({ error: "Email address is required." }).trim().email({ error: "Please enter a valid email address." }),
  reason: z.string({ error: "Reason is required." }).trim().min(1, { error: "Reason is required." }),
  details: z.string({ error: "Additional details are required." }).trim().min(1, { error: "Additional details are required." }),
});

function formatValidationErrors(error: ZodError): string[] {
  return Array.from(new Set(error.issues.map((issue) => issue.message)));
}

export async function POST(request: Request) {
  try {
    const client = requireSanityWriteClient();
    const payload = returnExchangeRequestSchema.parse(await request.json());
    const createdAt = new Date().toISOString();

    const document = await client.create({
      _type: "returnExchangeRequest",
      ...payload,
      status: "pending",
      createdAt,
    });

    try {
      await sendReturnExchangeRequestEmails({
        requestType: payload.requestType,
        orderNumber: payload.orderNumber,
        customerName: payload.customerName,
        phone: payload.phone,
        reason: payload.reason,
        details: payload.details,
        customerEmail: payload.email || undefined,
      });
    } catch (emailError) {
      console.warn("Return/exchange request created, but notification email failed.", emailError);
    }

    return Response.json({ ok: true, requestId: document._id });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatValidationErrors(error);
      return Response.json({ error: errors[0], errors }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to submit request.";
    return Response.json({ error: message }, { status: 400 });
  }
}
