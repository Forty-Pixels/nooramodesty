import { defineField, defineType } from "sanity";

export const homepageProductSection = defineType({
  name: "homepageProductSection",
  title: "Homepage product section",
  type: "object",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      description: "Optional category link for this section.",
    }),
    defineField({
      name: "products",
      title: "Products",
      type: "array",
      of: [{ type: "reference", to: [{ type: "product" }] }],
      validation: (rule) => rule.required().min(1).max(8),
      description: "Pick up to 8 products/images for this homepage section.",
    }),
    defineField({
      name: "isVisible",
      title: "Visible",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      count: "products.length",
    },
    prepare({ title, count }) {
      return {
        title,
        subtitle: `${count || 0} products`,
      };
    },
  },
});

export const inNooraImage = defineType({
  name: "inNooraImage",
  title: "#InNoora image",
  type: "object",
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "alt",
      title: "Alt text",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "linkedProduct",
      title: "Linked product",
      type: "reference",
      to: [{ type: "product" }],
      description: "Optional product worn in this customer picture.",
    }),
    defineField({
      name: "customerName",
      title: "Customer name",
      type: "string",
    }),
  ],
  preview: {
    select: {
      title: "alt",
      media: "image",
      subtitle: "customerName",
    },
  },
});

export const homepage = defineType({
  name: "homepage",
  title: "Homepage",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Internal title",
      type: "string",
      initialValue: "Homepage",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "hero",
      title: "Hero",
      type: "object",
      fields: [
        defineField({
          name: "leftImage",
          title: "Left image",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "rightImage",
          title: "Right image",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "centerLogo",
          title: "Center logo",
          type: "image",
          options: { hotspot: true },
        }),
        defineField({
          name: "ctaLabel",
          title: "CTA label",
          type: "string",
          initialValue: "Shop All",
        }),
        defineField({
          name: "ctaHref",
          title: "CTA href",
          type: "string",
          initialValue: "/category/abayas",
        }),
      ],
    }),
    defineField({
      name: "productSections",
      title: "Product category sections",
      type: "array",
      of: [{ type: "homepageProductSection" }],
      validation: (rule) => rule.required().min(4).max(4),
      description: "Exactly 4 homepage product/category sections. Each supports up to 8 products.",
    }),
    defineField({
      name: "inNooraImages",
      title: "#InNoora customer images",
      type: "array",
      of: [{ type: "inNooraImage" }],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
  },
});
