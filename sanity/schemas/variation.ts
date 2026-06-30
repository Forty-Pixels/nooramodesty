import { defineField, defineType } from "sanity";

export const subVariation = defineType({
  name: "subVariation",
  title: "Size for color",
  type: "object",
  fields: [
    defineField({
      name: "size",
      title: "Size",
      type: "string",
      description: "Size shown after a shopper selects this color, for example XS, S, M, 54, 56, or 58.",
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
      title: "Unique SKU for this color + size",
      type: "string",
      description: "Visible variation/sub-SKU from Clickom. This SKU must be unique for this exact color + size combination.",
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

export const variation = defineType({
  name: "variation",
  title: "Color variation",
  type: "object",
  fields: [
    defineField({
      name: "name",
      title: "Color name",
      type: "string",
      description: "Parent color name shown to admins and used for cart/order snapshots, for example Black, Beige, or Navy.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "colorHex",
      title: "Hex swatch color",
      type: "string",
      description: "Required storefront swatch color, for example #000000.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Cart preview image for this color",
      type: "image",
      options: { hotspot: true },
      description: "Optional image used only for cart and checkout previews after this color is selected. It is not the swatch.",
    }),
    defineField({
      name: "imageUrl",
      title: "Cart preview image URL for this color",
      type: "url",
      description: "Optional external preview image URL. Used only when no uploaded preview image is set.",
    }),
    defineField({
      name: "clickomVariationId",
      title: "Clickom parent variation ID (optional)",
      type: "number",
      description: "Optional parent variation ID from Clickom. Orders and stock use the synced IDs inside sub-variations below.",
    }),
    defineField({
      name: "subVariations",
      title: "Sizes available for this color",
      type: "array",
      of: [{ type: "subVariation" }],
      description: "Sizes customers can choose after selecting this color. Every size must have one unique SKU.",
      validation: (rule) => rule.min(1),
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "clickomVariationId",
      media: "image",
    },
    prepare({ title, subtitle }) {
      return {
        title,
        subtitle: subtitle ? `Clickom: ${subtitle}` : "No Clickom parent ID",
      };
    },
  },
});
