import { defineField, defineType } from "sanity";

interface ProductSubVariationValue {
  size?: string;
  sku?: string;
}

interface ProductVariationValue {
  name?: string;
  colorHex?: string;
  subVariations?: ProductSubVariationValue[];
}

function normalizeVariationValue(value: string | undefined) {
  return value?.trim().toLowerCase();
}

function validateVariationHierarchy(value: unknown) {
  if (!Array.isArray(value)) return true;

  const colorNames = new Set<string>();
  const skus = new Set<string>();

  for (const variation of value as ProductVariationValue[]) {
    const colorName = normalizeVariationValue(variation.name);

    if (!colorName) return "Each parent variation must be a color name.";
    if (colorNames.has(colorName)) return `Color "${variation.name}" is duplicated.`;
    colorNames.add(colorName);

    if (!variation.colorHex?.trim()) return `Color "${variation.name}" needs a hex swatch value.`;

    const sizesForColor = new Set<string>();
    for (const subVariation of variation.subVariations || []) {
      const size = normalizeVariationValue(subVariation.size);
      const sku = normalizeVariationValue(subVariation.sku);

      if (!size) return `A size is missing under color "${variation.name}".`;
      if (sizesForColor.has(size)) return `Size "${subVariation.size}" is duplicated under color "${variation.name}".`;
      sizesForColor.add(size);

      if (!sku) return `Size "${subVariation.size}" under color "${variation.name}" needs a unique SKU.`;
      if (skus.has(sku)) return `SKU "${subVariation.sku}" is used more than once.`;
      skus.add(sku);
    }
  }

  return true;
}
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
      name: "sizeGuideImage",
      title: "Size guide image",
      type: "image",
      options: { hotspot: true },
      description: "Optional size guide shown on the product page. Upload the finished chart/image here instead of using a hardcoded table.",
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
      title: "Legacy display color (deprecated)",
      type: "string",
      description: "Deprecated. Use Storefront color variations below. Hidden to avoid conflicting color setup.",
      hidden: true,
    }),
    defineField({
      name: "collection",
      title: "Collection",
      type: "string",
    }),
    defineField({
      name: "variations",
      title: "Color variants and sizes",
      type: "array",
      of: [{ type: "variation" }],
      description: "One parent item per product color. Add sizes under each color. Each color + size row must map to one unique SKU.",
      validation: (rule) => rule.required().min(1).custom(validateVariationHierarchy),
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
      name: "isNewArrival",
      title: "New arrival badge",
      type: "boolean",
      description: "Show a New Arrival badge on product cards and product detail.",
      initialValue: false,
    }),
    defineField({
      name: "showLowStock",
      title: "Show manual low stock badge",
      type: "boolean",
      description: "Show a low-stock message using the manual count below. This is display-only and does not replace Clickom stock.",
      initialValue: false,
    }),
    defineField({
      name: "manualStockCount",
      title: "Manual low stock count",
      type: "number",
      description: "Display count for the low-stock badge, for example 3.",
      validation: (rule) => rule.min(0),
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
