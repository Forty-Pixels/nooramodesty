import { defineField, defineType } from "sanity";

export const subVariation = defineType({
  name: "subVariation",
  title: "Sub variation",
  type: "object",
  fields: [
    defineField({
      name: "size",
      title: "Storefront size/style label",
      type: "string",
      description: "Label shown to shoppers, for example XS, S, M, Custom, Bow - White, or another style label.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "clickomVariationId",
      title: "Clickom variation ID (synced)",
      type: "number",
      description: "Internal numeric variation ID from Clickom. Usually filled by Clickom sync from the variation SKU below. Used for stock checks and order approval.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sku",
      title: "Clickom variation SKU",
      type: "string",
      description: "Visible variation/sub-SKU from Clickom, for example 0068-1 for XS. Sync uses this to fill the Clickom variation ID.",
    }),
  ],
  preview: {
    select: {
      title: "size",
      subtitle: "sku",
    },
  },
});

export const variation = defineType({
  name: "variation",
  title: "Variation",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Storefront variation group",
      type: "string",
      description: "Group shown on the storefront, usually a color or parent option such as Black, Colour, or Size.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "colorHex",
      title: "Color swatch hex",
      type: "string",
      description: "Optional color swatch shown on the storefront, for example #000000.",
    }),
    defineField({
      name: "clickomVariationId",
      title: "Clickom parent variation ID (optional)",
      type: "number",
      description: "Optional parent variation ID from Clickom. Orders and stock use the synced IDs inside sub-variations below.",
    }),
    defineField({
      name: "subVariations",
      title: "Storefront sizes/styles",
      type: "array",
      of: [{ type: "subVariation" }],
      description: "Sizes/styles customers can choose. Add Clickom variation SKU values here, then run sync to fill IDs.",
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "clickomVariationId",
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle ? `Clickom: ${subtitle}` : "No Clickom parent ID",
      };
    },
  },
});
