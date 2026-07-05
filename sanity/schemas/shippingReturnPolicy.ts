import { defineField, defineType } from "sanity";

export const shippingReturnPolicySection = defineType({
  name: "shippingReturnPolicySection",
  title: "Policy section",
  type: "object",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "body", title: "Body", type: "text", validation: (rule) => rule.required() }),
  ],
  preview: {
    select: { title: "title" },
  },
});

export const shippingReturnPolicy = defineType({
  name: "shippingReturnPolicy",
  title: "Shipping & Return Policy",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Page title", type: "string", initialValue: "Shipping & Return Policy" }),
    defineField({ name: "eyebrow", title: "Eyebrow", type: "string", initialValue: "Delivery & Care" }),
    defineField({ name: "intro", title: "Intro", type: "text" }),
    defineField({
      name: "updatedAt",
      title: "Updated label",
      type: "string",
      description: "Shown as 'Updated ___' on the page, e.g. May 2026",
    }),
    defineField({
      name: "sections",
      title: "Sections",
      type: "array",
      of: [{ type: "shippingReturnPolicySection" }],
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: { title: "title" },
  },
});
