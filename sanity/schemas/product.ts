import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Product name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "sku",
      title: "Clickom product SKU",
      type: "string",
      description: "Visible product SKU from Clickom, for example 0068. Used by the sync to fill the hidden Clickom product ID.",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "blockContent",
    }),
    defineField({
      name: "plainDescription",
      title: "Short plain description",
      type: "text",
      rows: 3,
      description: "Used by current storefront components until rich text rendering is added.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "mainImage",
      title: "Main image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "images",
      title: "Product gallery",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "subCategory",
      title: "Sub category",
      type: "reference",
      to: [{ type: "subCategory" }],
      options: {
        filter: ({ document }) => {
          const category = document.category as { _ref?: string } | undefined;

          if (!category?._ref) {
            return {
              filter: "_type == 'subCategory'",
            };
          }

          return {
            filter: "_type == 'subCategory' && category._ref == $categoryId",
            params: { categoryId: category._ref },
          };
        },
      },
      description: "Select category first. Dropdown then shows only that category's subcategories.",
    }),
    defineField({
      name: "price",
      title: "Price",
      type: "number",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: "salePrice",
      title: "Sale price",
      type: "number",
      validation: (rule) =>
        rule.min(0).custom((salePrice, context) => {
          if (salePrice === undefined) return true;

          const price = (context.document?.price as number | undefined) ?? undefined;
          if (price === undefined) return true;

          return salePrice < price || "Sale price must be lower than the regular price.";
        }),
    }),
    defineField({
      name: "type",
      title: "Type",
      type: "string",
    }),
    defineField({
      name: "color",
      title: "Display color",
      type: "string",
    }),
    defineField({
      name: "collection",
      title: "Collection",
      type: "string",
    }),
    defineField({
      name: "variations",
      title: "Storefront variations",
      type: "array",
      of: [{ type: "variation" }],
      description: "Colors/sizes shown on the storefront. Each size should include its Clickom variation SKU so sync can connect live stock and order approval.",
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: "materialSpecs",
      title: "Material specs",
      type: "materialSpecs",
    }),
    defineField({
      name: "enablePreOrders",
      title: "Enable pre-orders",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "enableCustomSizes",
      title: "Enable custom sizes",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isVisible",
      title: "Visible on storefront",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "clickomProductId",
      title: "Clickom product ID (synced)",
      type: "number",
      description: "Internal numeric product ID from Clickom. Usually filled by Clickom sync from the product SKU. Required before orders can be approved into Clickom.",
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: "title",
      media: "mainImage",
      category: "category.title",
    },
    prepare({ title, media, category }) {
      return {
        title,
        media,
        subtitle: category,
      };
    },
  },
});
