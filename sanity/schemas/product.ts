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
      title: "SKU",
      type: "string",
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
      validation: (rule) => rule.min(0),
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
      title: "Variations",
      type: "array",
      of: [{ type: "variation" }],
      description: "Stock is not stored here. Clickom IDs connect live stock lookups.",
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
      title: "Clickom product ID",
      type: "number",
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
