import { createClient } from "@sanity/client";

const apply = process.argv.includes("--apply");
const requiredEnv = ["NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET", "SANITY_API_TOKEN"];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

const orders = await client.fetch(`*[_type == "order" && count(items[]) > 0]{
  _id,
  orderNumber,
  items[]{
    ...,
    productId,
    clickomVariationId,
    size,
    selectedSize,
    sku
  }
}`);

const productIds = Array.from(new Set(
  orders
    .flatMap((order) => order.items || [])
    .map((item) => item.productId)
    .filter(Boolean),
));

const products = productIds.length
  ? await client.fetch(`*[_type == "product" && _id in $ids]{
      _id,
      subVariations[]{
        size,
        sku,
        clickomVariationId
      }
    }`, { ids: productIds })
  : [];

const subVariationByProductAndClickomId = new Map();

for (const product of products) {
  for (const subVariation of product.subVariations || []) {
    if (subVariation.clickomVariationId) {
      subVariationByProductAndClickomId.set(
        `${product._id}:${subVariation.clickomVariationId}`,
        subVariation,
      );
    }
  }
}

let changedOrders = 0;
let changedItems = 0;

for (const order of orders) {
  let orderChanged = false;
  const nextItems = (order.items || []).map((item) => {
    const matchedSubVariation = subVariationByProductAndClickomId.get(`${item.productId}:${item.clickomVariationId}`);
    const nextSize = item.size || item.selectedSize || matchedSubVariation?.size;
    const nextSku = item.sku || matchedSubVariation?.sku;
    const patch = {};

    if (!item.size && nextSize) patch.size = nextSize;
    if (!item.sku && nextSku) patch.sku = nextSku;

    if (Object.keys(patch).length === 0) return item;

    orderChanged = true;
    changedItems += 1;
    return { ...item, ...patch };
  });

  if (!orderChanged) continue;

  changedOrders += 1;
  console.log(`${apply ? "Updating" : "Would update"} ${order.orderNumber || order._id}`);

  if (apply) {
    await client.patch(order._id).set({ items: nextItems }).commit();
  }
}

console.log(`${apply ? "Updated" : "Dry run:"} ${changedItems} item(s) in ${changedOrders} order(s).`);
if (!apply) console.log("Run with --apply to write changes.");
