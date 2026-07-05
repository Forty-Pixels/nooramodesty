import { defineField, defineType } from "sanity";

export const subVariation = defineType({
  name: "subVariation",
  title: "Size",
  type: "object",
  fields: [
    defineField({
      name: "size",
      title: "Size",
      type: "string",
      description: "Size shown on the product page, for example XS, S, M, 54, 56, or 58. Use exactly \"Custom\" to map this entry to Clickom's custom-size sub-SKU — it powers the storefront's custom size (+) button instead of appearing as a regular size option.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "clickomVariationId",
      title: "Clickom variation ID (synced)",
      type: "number",
      description: "Internal numeric variation ID from Clickom. Usually filled by Clickom sync from the SKU below. Used for stock checks and order approval.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sku",
      title: "Unique SKU for this size",
      type: "string",
      description: "Visible variation/sub-SKU from Clickom. This SKU must be unique for this exact size.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "size",
      subtitle: "sku",
    },
  },
});
