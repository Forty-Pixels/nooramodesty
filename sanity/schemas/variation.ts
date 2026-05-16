import { defineField, defineType } from "sanity";

export const subVariation = defineType({
  name: "subVariation",
  title: "Sub variation",
  type: "object",
  fields: [
    defineField({
      name: "size",
      title: "Size",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "clickomVariationId",
      title: "Clickom variation ID",
      type: "number",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
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
      title: "Name",
      type: "string",
      description: "Color or parent variation name, for example Black.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "colorHex",
      title: "Color hex",
      type: "string",
      description: "Optional color swatch, for example #000000.",
    }),
    defineField({
      name: "clickomVariationId",
      title: "Clickom variation ID",
      type: "number",
    }),
    defineField({
      name: "subVariations",
      title: "Sub variations",
      type: "array",
      of: [{ type: "subVariation" }],
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
