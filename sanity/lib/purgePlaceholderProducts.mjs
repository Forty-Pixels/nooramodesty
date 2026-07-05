import { createClient } from "@sanity/client";

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

const apply = process.argv.includes("--apply");

// Matches: "PRODUCT 1", "PRODUCT 16", "PRODUCT ONE", "PRODUCT FIFTEEN",
// "ELEGANT MAXI DRESS", "FLORAL PRINT DRESS", "MODEST WRAP DRESS"
const PLACEHOLDER_PATTERN =
  /^(product\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)|elegant maxi dress|floral print dress|modest wrap dress)$/i;

const products = await client.fetch(
  `*[_type == "product"]{_id, title, clickomProductId, "slug": slug.current} | order(title asc)`,
);

const toDelete = products.filter((p) => PLACEHOLDER_PATTERN.test((p.title || "").trim()));
const toKeep = products.filter((p) => !PLACEHOLDER_PATTERN.test((p.title || "").trim()));
const deleteIds = new Set(toDelete.map((p) => p._id));

console.log(`\nFound ${products.length} products total`);
console.log(`  ${toKeep.length} to keep`);
console.log(`  ${toDelete.length} to delete`);

console.log("\n-- KEEPING --");
for (const p of toKeep) {
  const tag = p.clickomProductId ? ` (Clickom: ${p.clickomProductId})` : " (no Clickom ID)";
  console.log(`  ${p.title}${tag}`);
}

console.log("\n-- DELETING --");
for (const p of toDelete) {
  console.log(`  ${p.title} [${p._id}]`);
}

if (!apply) {
  console.log("\nDry run — pass --apply to delete.\n");
  process.exit(0);
}

// Clean homepage references before deleting documents
const homepages = await client.fetch(`*[_type == "homepage"]{
  _id,
  productSections[]{_key, title, category, isVisible, products[]{_key, _ref, _type}},
  inNooraImages[]{_key, image, alt, customerName, linkedProduct}
}`);

for (const homepage of homepages) {
  let changed = false;

  const cleanedSections = (homepage.productSections || []).map((section) => {
    const before = (section.products || []).length;
    const filtered = (section.products || []).filter((ref) => !deleteIds.has(ref._ref));
    if (filtered.length < before) {
      console.log(`  Homepage section "${section.title}": removed ${before - filtered.length} product ref(s)`);
      changed = true;
    }
    return { ...section, products: filtered };
  });

  const cleanedInNoora = (homepage.inNooraImages || []).map((img) => {
    if (img.linkedProduct && deleteIds.has(img.linkedProduct._ref)) {
      console.log(`  #InNoora image "${img.alt}": removed linkedProduct ref`);
      changed = true;
      const { linkedProduct: _removed, ...rest } = img;
      return rest;
    }
    return img;
  });

  if (changed) {
    await client
      .patch(homepage._id)
      .set({ productSections: cleanedSections, inNooraImages: cleanedInNoora })
      .commit();
    console.log(`  Patched homepage [${homepage._id}]`);
  }
}

// Delete the product documents
let deleted = 0;
for (const p of toDelete) {
  await client.delete(p._id);
  console.log(`Deleted: ${p.title}`);
  deleted++;
}

console.log(`\nDone. Deleted ${deleted} placeholder products.\n`);
