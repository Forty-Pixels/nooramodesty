import "server-only";
import { Product } from "@/types/product";
import { SITE_URL } from "@/lib/server/emailTemplates/layout";

// Column order is fixed by Meta's catalog template — do not reorder or drop columns.
// The commented "# Required | ..." row in the template is documentation, not part of the
// feed; Meta reads this header row.
const CATALOG_COLUMNS = [
  "id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "link",
  "image_link",
  "brand",
  "google_product_category",
  "fb_product_category",
  "quantity_to_sell_on_facebook",
  "sale_price",
  "sale_price_effective_date",
  "item_group_id",
  "gender",
  "color",
  "size",
  "age_group",
  "material",
  "pattern",
  "shipping",
  "shipping_weight",
  "offer_disclaimer",
  "offer_disclaimer_url",
  "video[0].url",
  "video[0].tag[0]",
  "gtin",
  "product_tags[0]",
  "product_tags[1]",
  "style[0]",
] as const;

const BRAND = "Noora Modesty";
const CURRENCY = "LKR";
const GOOGLE_PRODUCT_CATEGORY = "Apparel & Accessories > Clothing";
const FB_PRODUCT_CATEGORY = "Clothing & Accessories > Clothing";

const isCustomSizeLabel = (size: string | undefined) => (size || "").trim().toLowerCase() === "custom";

function escapeCsvValue(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

// Meta rejects prices that carry thousands separators, and wants "<amount> <ISO currency>".
function formatPrice(amount: number): string {
  return `${amount.toFixed(2)} ${CURRENCY}`;
}

// Meta's spec: plain text, no line breaks, and explicitly not all-capitals.
function formatDescription(product: Product): string {
  const description = (product.description || product.title || "").replace(/\s+/g, " ").trim();
  return description.length > 0 ? description.slice(0, 9999) : product.title;
}

/**
 * One row per orderable size, because Meta models sizes as separate items grouped by
 * `item_group_id`. The custom-size variation is skipped — it is made to order, has no catalog
 * identity, and would advertise a product nobody can click "buy" on.
 *
 * `id` is the Clickom SKU. It has to match the `content_id` the Meta Pixel fires, or dynamic
 * ads cannot tie a view or a purchase back to the catalogue item.
 */
export function buildCatalogCsv(
  products: Product[],
  stockByVariationId: Record<number, number>,
): string {
  const rows: string[][] = [];

  for (const product of products) {
    for (const subVariation of product.subVariations || []) {
      if (isCustomSizeLabel(subVariation.size)) continue;

      const sku = subVariation.sku?.trim();
      if (!sku) continue;

      const stock = stockByVariationId[subVariation.clickomVariationId];

      // Pre-orders are always orderable, so they are "in stock" as far as Meta is concerned.
      // For everything else an unknown stock is treated as available rather than hidden — a
      // failed lookup should not silently pull a product out of the ad catalogue.
      const availability = product.enablePreOrders
        ? "in stock"
        : typeof stock === "number" && stock <= 0
          ? "out of stock"
          : "in stock";

      const sellableQuantity =
        !product.enablePreOrders && typeof stock === "number" && stock > 0 ? String(stock) : "";

      rows.push([
        sku,
        product.title,
        formatDescription(product),
        availability,
        "new",
        formatPrice(product.price),
        `${SITE_URL}/product/${product.slug}`,
        product.mainImage || "",
        BRAND,
        GOOGLE_PRODUCT_CATEGORY,
        FB_PRODUCT_CATEGORY,
        sellableQuantity,
        product.salePrice ? formatPrice(product.salePrice) : "",
        "", // sale_price_effective_date — sale runs until the sale price is removed in Sanity.
        product._id, // item_group_id — groups every size of one product.
        "female",
        product.colorName || "",
        subVariation.size,
        "adult",
        product.materialSpecs?.composition || "",
        "", // pattern
        "", // shipping
        "", // shipping_weight
        "", // offer_disclaimer
        "", // offer_disclaimer_url
        "", // video[0].url
        "", // video[0].tag[0]
        "", // gtin
        product.category || "",
        product.collection || "",
        "", // style[0]
      ]);
    }
  }

  return [
    CATALOG_COLUMNS.join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");
}
