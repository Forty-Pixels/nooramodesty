import { defineField, defineType } from "sanity";

export const materialSpecs = defineType({
  name: "materialSpecs",
  title: "Material specs",
  type: "object",
  fields: [
    defineField({
      name: "gsm",
      title: "GSM",
      type: "number",
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: "composition",
      title: "Composition",
      type: "string",
    }),
    defineField({
      name: "properties",
      title: "Properties",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "macroImage",
      title: "Macro image",
      type: "image",
      options: { hotspot: true },
    }),
  ],
});
