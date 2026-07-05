import { createClient } from "@sanity/client";
import fs from "node:fs/promises";

const APPLY = process.argv.includes("--apply");
const REPORT_PATH = "CLICKOM_PRODUCT_SYNC_REPORT.md";
const REQUIRED_ENV = [
  "CLICKOM_BASE_URL",
  "CLICKOM_CLIENT_ID",
  "CLICKOM_CLIENT_SECRET",
  "CLICKOM_USERNAME",
  "CLICKOM_PASSWORD",
  "NEXT_PUBLIC_SANITY_PROJECT_ID",
  "NEXT_PUBLIC_SANITY_DATASET",
  "SANITY_API_TOKEN",
];

const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

function normalizeBaseUrl(value) {
  return value.replace(/\/$/, "");
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeSku(value) {
  return String(value || "").trim().toLowerCase();
}

function skuKeys(value) {
  const normalized = normalizeSku(value);
  if (!normalized) return [];

  const strippedLeadingZeros = normalized.replace(/^0+/, "");
  return Array.from(new Set([normalized, strippedLeadingZeros].filter(Boolean)));
}

function valueEquals(left, right) {
  return normalizeText(left) && normalizeText(left) === normalizeText(right);
}

async function getClickomToken() {
  const formData = new FormData();
  formData.append("client_id", process.env.CLICKOM_CLIENT_ID);
  formData.append("client_secret", process.env.CLICKOM_CLIENT_SECRET);
  formData.append("username", process.env.CLICKOM_USERNAME);
  formData.append("password", process.env.CLICKOM_PASSWORD);

  const response = await fetch(`${normalizeBaseUrl(process.env.CLICKOM_BASE_URL)}/api/customapi/login`, {
    method: "POST",
    headers: { accept: "application/json" },
    body: formData,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok || !data?.token) {
    throw new Error(`Clickom login failed: ${JSON.stringify(data)}`);
  }

  return data.token;
}

async function clickomGet(path, token) {
  const response = await fetch(`${normalizeBaseUrl(process.env.CLICKOM_BASE_URL)}/api/customapi${path}`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`Clickom ${path} failed: ${JSON.stringify(data)}`);
  }

  return data;
}

async function fetchClickomProducts() {
  const token = await getClickomToken();
  const products = [];

  for (let page = 1; page < 100; page += 1) {
    const data = await clickomGet(`/products?page=${page}`, token);
    const pageData = data?.data?.data;

    if (Array.isArray(pageData)) {
      products.push(...pageData);

      if (!data.data.next_page_url && page >= Number(data.data.last_page || page)) break;
      if (pageData.length === 0) break;
      continue;
    }

    if (Array.isArray(data?.data)) {
      products.push(...data.data);
      break;
    }

    if (Array.isArray(data)) {
      products.push(...data);
      break;
    }

    break;
  }

  return products;
}

async function fetchSanityProducts() {
  return sanity.fetch(
    `*[_type == "product"] | order(title asc){
      _id,
      _originalId,
      title,
      sku,
      clickomProductId,
      subVariations[]{
        _key,
        size,
        sku,
        clickomVariationId
      }
    }`,
    {},
    { perspective: "drafts" },
  );
}

function flattenClickomVariations(product) {
  const flattened = [];

  for (const variation of product.variations || []) {
    if (Array.isArray(variation.sub_variations) && variation.sub_variations.length > 0) {
      for (const subVariation of variation.sub_variations) {
        flattened.push({
          variationId: Number(subVariation.variation_id),
          parentVariationId: variation.product_variation_id ? Number(variation.product_variation_id) : undefined,
          parentName: variation.name,
          name: subVariation.second_variable_name || subVariation.name,
          subSku: subVariation.sub_sku,
          stock: subVariation.stock,
        });
      }
      continue;
    }

    flattened.push({
      variationId: Number(variation.variation_id),
      parentVariationId: variation.product_variation_id ? Number(variation.product_variation_id) : undefined,
      parentName: undefined,
      name: variation.name,
      subSku: variation.sub_sku,
      stock: variation.stock,
    });
  }

  return flattened.filter((item) => Number.isFinite(item.variationId));
}

function buildClickomIndexes(products) {
  const bySku = new Map();
  const byName = new Map();

  for (const product of products) {
    const sku = normalizeSku(product.sku);
    const name = normalizeText(product.name);
    const entry = {
      product,
      productId: Number(product.product_id),
      sku: product.sku,
      name: product.name,
      variations: flattenClickomVariations(product),
    };

    for (const key of skuKeys(sku)) {
      bySku.set(key, entry);
    }
    if (name) {
      byName.set(name, [...(byName.get(name) || []), entry]);
    }
  }

  return { bySku, byName };
}

function findClickomProduct(sanityProduct, indexes) {
  for (const sku of skuKeys(sanityProduct.sku)) {
    if (indexes.bySku.has(sku)) {
      return { match: indexes.bySku.get(sku), reason: "sku" };
    }
  }

  const nameMatches = indexes.byName.get(normalizeText(sanityProduct.title)) || [];

  if (nameMatches.length === 1) {
    return { match: nameMatches[0], reason: "name" };
  }

  return {
    match: null,
    reason: nameMatches.length > 1 ? "ambiguous-name" : "unmatched",
    candidates: nameMatches,
  };
}

function scoreVariation(sanitySubVariation, clickomVariation) {
  let score = 0;

  if (normalizeSku(sanitySubVariation.sku) && normalizeSku(sanitySubVariation.sku) === normalizeSku(clickomVariation.subSku)) {
    return 100;
  }

  if (valueEquals(sanitySubVariation.size, clickomVariation.name)) score += 4;
  if (valueEquals(sanitySubVariation.size, clickomVariation.parentName)) score += 4;

  return score;
}

function matchSubVariation(sanitySubVariation, clickomVariations) {
  const scored = clickomVariations
    .map((clickomVariation) => ({
      clickomVariation,
      score: scoreVariation(sanitySubVariation, clickomVariation),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { match: null, reason: "unmatched" };
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return { match: null, reason: "ambiguous", candidates: scored.filter((item) => item.score === scored[0].score) };
  }

  return { match: scored[0].clickomVariation, reason: scored[0].score === 100 ? "sku" : "label" };
}

function buildProductPatch(sanityProduct, clickomMatch) {
  const set = {};
  const notes = [];
  let hasChanges = false;
  const nextSubVariations = (sanityProduct.subVariations || []).map((subVariation) => {
    const variationMatch = matchSubVariation(subVariation, clickomMatch.variations);

    if (!variationMatch.match) {
      notes.push({
        type: "variation-unmatched",
        size: subVariation.size,
        reason: variationMatch.reason,
        candidates: variationMatch.candidates || [],
      });
      return subVariation;
    }

    const nextSubVariation = { ...subVariation };

    if (nextSubVariation.clickomVariationId !== variationMatch.match.variationId) {
      nextSubVariation.clickomVariationId = variationMatch.match.variationId;
      hasChanges = true;
    }

    if (!nextSubVariation.sku && variationMatch.match.subSku) {
      nextSubVariation.sku = variationMatch.match.subSku;
      hasChanges = true;
    }

    notes.push({
      type: "variation-matched",
      size: subVariation.size,
      clickomVariationId: variationMatch.match.variationId,
      subSku: variationMatch.match.subSku,
      reason: variationMatch.reason,
    });

    return nextSubVariation;
  });

  if (sanityProduct.clickomProductId !== clickomMatch.productId) {
    set.clickomProductId = clickomMatch.productId;
    hasChanges = true;
  }

  if (!sanityProduct.sku && clickomMatch.sku) {
    set.sku = clickomMatch.sku;
    hasChanges = true;
  }

  if (hasChanges) {
    set.subVariations = nextSubVariations;
  }

  return { set, hasChanges, notes };
}

function formatVariationCandidate(candidate) {
  return [
    `id ${candidate.clickomVariation.variationId}`,
    candidate.clickomVariation.parentName,
    candidate.clickomVariation.name,
    candidate.clickomVariation.subSku,
  ].filter(Boolean).join(" / ");
}

function renderReport(report) {
  const lines = [
    "# Clickom Product Sync Report",
    "",
    `Mode: ${APPLY ? "apply" : "dry-run"}`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Clickom products: ${report.clickomCount}`,
    `- Sanity products: ${report.sanityCount}`,
    `- Product matches: ${report.productMatches.length}`,
    `- Product unmatched: ${report.productUnmatched.length}`,
    `- Product ambiguous: ${report.productAmbiguous.length}`,
    `- Products changed: ${report.changed.length}`,
    "",
    "## Changed / Would Change",
    "",
  ];

  if (report.changed.length === 0) {
    lines.push("None.", "");
  } else {
    for (const item of report.changed) {
      lines.push(`- ${item.title} (${item._id}) -> Clickom product ${item.clickomProductId} via ${item.reason}`);
    }
    lines.push("");
  }

  lines.push("## Product Matches", "");

  for (const item of report.productMatches) {
    lines.push(`- ${item.title} -> ${item.clickomName} (${item.clickomProductId}) via ${item.reason}`);
  }

  if (report.productMatches.length === 0) lines.push("None.");
  lines.push("", "## Unmatched Products", "");

  for (const item of report.productUnmatched) {
    lines.push(`- ${item.title}${item.sku ? ` (SKU ${item.sku})` : ""}`);
  }

  if (report.productUnmatched.length === 0) lines.push("None.");
  lines.push("", "## Ambiguous Products", "");

  for (const item of report.productAmbiguous) {
    lines.push(`- ${item.title}: ${item.candidates.map((candidate) => `${candidate.name} (${candidate.productId})`).join(", ")}`);
  }

  if (report.productAmbiguous.length === 0) lines.push("None.");
  lines.push("", "## Variation Review", "");

  for (const item of report.variationNotes) {
    if (item.type === "variation-matched") {
      lines.push(`- ${item.productTitle}: ${item.size} -> ${item.clickomVariationId}${item.subSku ? ` (${item.subSku})` : ""} via ${item.reason}`);
      continue;
    }

    const candidates = item.candidates?.length
      ? ` Candidates: ${item.candidates.map(formatVariationCandidate).join("; ")}`
      : "";
    lines.push(`- NEEDS REVIEW: ${item.productTitle}: ${item.size} (${item.reason}).${candidates}`);
  }

  if (report.variationNotes.length === 0) lines.push("None.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

const clickomProducts = await fetchClickomProducts();
const sanityProducts = await fetchSanityProducts();
const indexes = buildClickomIndexes(clickomProducts);
const report = {
  clickomCount: clickomProducts.length,
  sanityCount: sanityProducts.length,
  productMatches: [],
  productUnmatched: [],
  productAmbiguous: [],
  changed: [],
  variationNotes: [],
};

for (const sanityProduct of sanityProducts) {
  const productMatch = findClickomProduct(sanityProduct, indexes);

  if (!productMatch.match) {
    const entry = {
      _id: sanityProduct._id,
      title: sanityProduct.title,
      sku: sanityProduct.sku,
      candidates: productMatch.candidates || [],
    };

    if (productMatch.reason === "ambiguous-name") report.productAmbiguous.push(entry);
    else report.productUnmatched.push(entry);
    continue;
  }

  report.productMatches.push({
    _id: sanityProduct._id,
    title: sanityProduct.title,
    clickomName: productMatch.match.name,
    clickomProductId: productMatch.match.productId,
    reason: productMatch.reason,
  });

  const patch = buildProductPatch(sanityProduct, productMatch.match);
  report.variationNotes.push(...patch.notes.map((note) => ({ ...note, productTitle: sanityProduct.title })));

  if (!patch.hasChanges) continue;

  report.changed.push({
    _id: sanityProduct._id,
    title: sanityProduct.title,
    clickomProductId: productMatch.match.productId,
    reason: productMatch.reason,
  });

  if (APPLY) {
    await sanity.patch(sanityProduct._originalId).set(patch.set).commit();
  }
}

await fs.writeFile(REPORT_PATH, renderReport(report));

console.log(`${APPLY ? "Applied" : "Dry run complete"}. Report: ${REPORT_PATH}`);
console.log(`Matched ${report.productMatches.length}/${report.sanityCount} Sanity products. Changes: ${report.changed.length}.`);
