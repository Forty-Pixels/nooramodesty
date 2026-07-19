import { defineField, defineType } from "sanity";

interface ProductSubVariationValue {
  size?: string;
  sku?: string;
}

function normalizeVariationValue(value: string | undefined) {
  return value?.trim().toLowerCase();
}

function validateSubVariations(value: unknown) {
  if (!Array.isArray(value)) return true;

  const sizes = new Set<string>();
  const skus = new Set<string>();

  for (const subVariation of value as ProductSubVariationValue[]) {
    const size = normalizeVariationValue(subVariation.size);
    const sku = normalizeVariationValue(subVariation.sku);

    if (!size) return "A size is missing.";
    if (sizes.has(size)) return `Size "${subVariation.size}" is duplicated.`;
    sizes.add(size);

    if (!sku) return `Size "${subVariation.size}" needs a unique SKU.`;
    if (skus.has(sku)) return `SKU "${subVariation.sku}" is used more than once.`;
    skus.add(sku);
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
      title: "Size chart image",
      type: "image",
      options: { hotspot: true },
      description: "Optional size chart shown on the product page. Upload the finished chart/image here instead of using a hardcoded table.",
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
      name: "colorName",
      title: "Color name",
      type: "string",
      description: "This product's color, for example Black, Beige, or Navy. Each color is its own separate product — sizes below belong to this one color.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "colorHex",
      title: "Hex swatch color",
      type: "string",
      description: "Storefront swatch color shown next to the color name, for example #000000.",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "styleGroup",
      title: "Style group",
      type: "string",
      description: "Shared value across the color variants of the same design, for example \"Vogue Abaya\". Used to surface other colors of this style in Related Products. Leave blank if this design has no other colors.",
    }),
    defineField({
      name: "collection",
      title: "Collection",
      type: "string",
    }),
    defineField({
      name: "subVariations",
      title: "Sizes",
      type: "array",
      of: [{ type: "subVariation" }],
      description: "Sizes available for this color. Every size must have one unique SKU.",
      validation: (rule) => rule.required().min(1).custom(validateSubVariations),
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
