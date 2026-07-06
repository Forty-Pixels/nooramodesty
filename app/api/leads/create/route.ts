import { z, ZodError } from "zod";
import { sendLeadSubmissionEmails } from "@/lib/server/email";
import { requireSanityWriteClient } from "@/lib/server/sanity";

export const runtime = "nodejs";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const MAX_ATTACHMENTS = 5;
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const leadSubmissionSchema = z.object({
  source: z.enum(["newsletter", "inquiry", "suggestion"], { error: "Choose a valid submission type." }),
  name: z.string().trim().max(80).optional(),
  email: z.string({ error: "Email address is required." }).trim().email({ error: "Please enter a valid email address." }),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000).optional(),
  suggestionType: z.enum(["general", "design"]).optional(),
});

function optionalString(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function formatValidationErrors(error: ZodError): string[] {
  return Array.from(new Set(error.issues.map((issue) => issue.message)));
}

function readAttachments(formData: FormData): File[] {
  const files = formData.getAll("attachments").filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length > MAX_ATTACHMENTS) {
    throw new Error(`Upload up to ${MAX_ATTACHMENTS} files.`);
  }

  for (const file of files) {
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type)) {
      throw new Error("Attachments must be JPEG, PNG, WEBP, or PDF files.");
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error("Each attachment must be 5MB or smaller.");
    }
  }

  return files;
}

export async function POST(request: Request) {
  try {
    const client = requireSanityWriteClient();
    const formData = await request.formData();
    const payload = leadSubmissionSchema.parse({
      source: optionalString(formData.get("source")),
      name: optionalString(formData.get("name")),
      email: optionalString(formData.get("email")),
      phone: optionalString(formData.get("phone")),
      subject: optionalString(formData.get("subject")),
      message: optionalString(formData.get("message")),
      suggestionType: optionalString(formData.get("suggestionType")),
    });
    const attachments = readAttachments(formData);
    const uploadedAttachments = await Promise.all(
      attachments.map(async (file) => {
        const asset = await client.assets.upload("file", file, {
          filename: file.name,
          contentType: file.type,
        });

        return {
          _key: crypto.randomUUID(),
          _type: "leadSubmissionAttachment",
          file: {
            _type: "file",
            asset: {
              _type: "reference",
              _ref: asset._id,
            },
          },
          filename: file.name,
        };
      }),
    );

    const document = await client.create({
      _type: "leadSubmission",
      ...payload,
      attachments: uploadedAttachments,
      status: "new",
      createdAt: new Date().toISOString(),
    });

    try {
      await sendLeadSubmissionEmails({
        ...payload,
        attachmentNames: uploadedAttachments.map((attachment) => attachment.filename).filter(Boolean),
      });
    } catch (emailError) {
      console.warn("Lead submission created, but notification email failed.", emailError);
    }

    return Response.json({ ok: true, leadId: document._id });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = formatValidationErrors(error);
      return Response.json({ error: errors[0], errors }, { status: 400 });
    }

    const message = error instanceof Error ? error.message : "Unable to submit request.";
    return Response.json({ error: message }, { status: 400 });
  }
}
