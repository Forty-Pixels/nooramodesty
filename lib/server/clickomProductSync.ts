import "server-only";

import { requireSanityWriteClient } from "@/lib/server/sanity";

interface SanitySubVariation {
  _key: string;
  size?: string;
  sku?: string;
  clickomVariationId?: number;
}

interface SanityVariation {
  _key: string;
  name?: string;
  colorHex?: string;
  clickomVariationId?: number;
  subVariations?: SanitySubVariation[];
}

interface SanityProductForSync {
  _id: string;
  title?: string;
  sku?: string;
  clickomProductId?: number;
  variations?: SanityVariation[];
}

interface ClickomVariationForSync {
  variationId: number;
  parentVariationId?: number;
  parentName?: string;
  name?: string;
  subSku?: string;
  stock?: unknown;
}

interface ClickomProductForSync {
  product: Record<string, unknown>;
  productId: number;
  sku?: string;
  name?: string;
  variations: ClickomVariationForSync[];
}

interface ProductMatch {
  match: ClickomProductForSync | null;
  reason: "sku" | "name" | "ambiguous-name" | "unmatched";
  candidates?: ClickomProductForSync[];
}

interface VariationMatch {
  match: ClickomVariationForSync | null;
  reason: "sku" | "label" | "ambiguous" | "unmatched";
  candidates?: Array<{ clickomVariation: ClickomVariationForSync; score: number }>;
}

interface ProductPatch {
  set: Partial<SanityProductForSync>;
  hasChanges: boolean;
  notes: Array<Record<string, unknown>>;
}

export interface ClickomProductSyncReport {
  mode: "dry-run" | "apply";
  generatedAt: string;
  clickomCount: number;
  sanityCount: number;
  productMatches: Array<Record<string, unknown>>;
  productUnmatched: Array<Record<string, unknown>>;
  productAmbiguous: Array<Record<string, unknown>>;
  changed: Array<Record<string, unknown>>;
  variationNotes: Array<Record<string, unknown>>;
}

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

function normalizeText(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeSku(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function skuKeys(value: unknown) {
  const normalized = normalizeSku(value);
  if (!normalized) return [];

  const strippedLeadingZeros = normalized.replace(/^0+/, "");
  return Array.from(new Set([normalized, strippedLeadingZeros].filter(Boolean)));
}

function valueEquals(left: unknown, right: unknown) {
  return normalizeText(left) && normalizeText(left) === normalizeText(right);
}

function getNumber(value: unknown): number | undefined {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function readArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
}

async function getClickomToken() {
  const baseUrl = process.env.CLICKOM_BASE_URL;
  const clientId = process.env.CLICKOM_CLIENT_ID;
  const clientSecret = process.env.CLICKOM_CLIENT_SECRET;
  const username = process.env.CLICKOM_USERNAME;
  const password = process.env.CLICKOM_PASSWORD;

  if (!baseUrl || !clientId || !clientSecret || !username || !password) {
    throw new Error("Clickom credentials are not configured.");
  }

  const formData = new FormData();
  formData.append("client_id", clientId);
  formData.append("client_secret", clientSecret);
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/customapi/login`, {
    method: "POST",
    headers: { accept: "application/json" },
    body: formData,
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const token = typeof data?.token === "string" ? data.token : undefined;

  if (!response.ok || !token) {
    throw new Error(`Clickom login failed: ${JSON.stringify(data)}`);
  }

  return token;
}

async function clickomGet(path: string, token: string) {
  const baseUrl = process.env.CLICKOM_BASE_URL;
  if (!baseUrl) throw new Error("CLICKOM_BASE_URL is not configured.");

  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/api/customapi${path}`, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as unknown;

  if (!response.ok) {
    throw new Error(`Clickom ${path} failed: ${JSON.stringify(data)}`);
  }

  return data;
}

async function fetchClickomProducts() {
  const token = await getClickomToken();
  const products: Record<string, unknown>[] = [];

  for (let page = 1; page < 100; page += 1) {
    const data = (await clickomGet(`/products?page=${page}`, token)) as Record<string, unknown> | null;
    const nestedData = data?.data && typeof data.data === "object" ? data.data as Record<string, unknown> : null;
    const pageData = readArray(nestedData?.data);

    if (pageData.length > 0) {
      products.push(...pageData);

      const lastPage = getNumber(nestedData?.last_page) || page;
      if (!nestedData?.next_page_url && page >= lastPage) break;
      continue;
    }

    const directNested = readArray(data?.data);
    if (directNested.length > 0) {
      products.push(...directNested);
      break;
    }

    const direct = readArray(data);
    if (direct.length > 0) {
      products.push(...direct);
      break;
    }

    break;
  }

  return products;
}

async function fetchSanityProducts() {
  const client = requireSanityWriteClient();

  return client.fetch<SanityProductForSync[]>(`*[_type == "product"] | order(title asc){
    _id,
    title,
    sku,
    clickomProductId,
    variations[]{
      _key,
      name,
      colorHex,
      clickomVariationId,
      subVariations[]{
        _key,
        size,
        sku,
        clickomVariationId
      }
    }
  }`);
}

function flattenClickomVariations(product: Record<string, unknown>) {
  const flattened: ClickomVariationForSync[] = [];

  for (const variation of readArray(product.variations)) {
    const subVariations = readArray(variation.sub_variations);

    if (subVariations.length > 0) {
      for (const subVariation of subVariations) {
        const variationId = getNumber(subVariation.variation_id);
        if (!variationId) continue;

        flattened.push({
          variationId,
          parentVariationId: getNumber(variation.product_variation_id),
          parentName: typeof variation.name === "string" ? variation.name : undefined,
          name: typeof subVariation.second_variable_name === "string" ? subVariation.second_variable_name : typeof subVariation.name === "string" ? subVariation.name : undefined,
          subSku: typeof subVariation.sub_sku === "string" ? subVariation.sub_sku : undefined,
          stock: subVariation.stock,
        });
      }
      continue;
    }

    const variationId = getNumber(variation.variation_id);
    if (!variationId) continue;

    flattened.push({
      variationId,
      name: typeof variation.name === "string" ? variation.name : undefined,
      subSku: typeof variation.sub_sku === "string" ? variation.sub_sku : undefined,
      stock: variation.stock,
    });
  }

  return flattened;
}

function buildClickomIndexes(products: Record<string, unknown>[]) {
  const bySku = new Map<string, ClickomProductForSync>();
  const byName = new Map<string, ClickomProductForSync[]>();

  for (const product of products) {
    const productId = getNumber(product.product_id);
    if (!productId) continue;

    const entry: ClickomProductForSync = {
      product,
      productId,
      sku: typeof product.sku === "string" ? product.sku : undefined,
      name: typeof product.name === "string" ? product.name : undefined,
      variations: flattenClickomVariations(product),
    };

    for (const key of skuKeys(entry.sku)) {
      bySku.set(key, entry);
    }

    const name = normalizeText(entry.name);
    if (name) byName.set(name, [...(byName.get(name) || []), entry]);
  }

  return { bySku, byName };
}

function findClickomProduct(sanityProduct: SanityProductForSync, indexes: ReturnType<typeof buildClickomIndexes>): ProductMatch {
  for (const sku of skuKeys(sanityProduct.sku)) {
    const match = indexes.bySku.get(sku);
    if (match) return { match, reason: "sku" };
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

function scoreVariation(sanityVariation: SanityVariation, sanitySubVariation: SanitySubVariation, clickomVariation: ClickomVariationForSync) {
  let score = 0;

  if (normalizeSku(sanitySubVariation.sku) && normalizeSku(sanitySubVariation.sku) === normalizeSku(clickomVariation.subSku)) {
    return 100;
  }

  if (valueEquals(sanitySubVariation.size, clickomVariation.name)) score += 4;
  if (valueEquals(sanitySubVariation.size, clickomVariation.parentName)) score += 4;
  if (valueEquals(sanityVariation.name, clickomVariation.name)) score += 3;
  if (valueEquals(sanityVariation.name, clickomVariation.parentName)) score += 3;

  return score;
}

function matchSubVariation(sanityVariation: SanityVariation, sanitySubVariation: SanitySubVariation, clickomVariations: ClickomVariationForSync[]): VariationMatch {
  const scored = clickomVariations
    .map((clickomVariation) => ({
      clickomVariation,
      score: scoreVariation(sanityVariation, sanitySubVariation, clickomVariation),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (scored.length === 0) return { match: null, reason: "unmatched" };
  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return { match: null, reason: "ambiguous", candidates: scored.filter((item) => item.score === scored[0].score) };
  }

  return { match: scored[0].clickomVariation, reason: scored[0].score === 100 ? "sku" : "label" };
}

function buildProductPatch(sanityProduct: SanityProductForSync, clickomMatch: ClickomProductForSync): ProductPatch {
  const set: Partial<SanityProductForSync> = {};
  const notes: ProductPatch["notes"] = [];
  let hasChanges = false;
  const nextVariations = (sanityProduct.variations || []).map((variation) => ({
    ...variation,
    subVariations: (variation.subVariations || []).map((subVariation) => {
      const variationMatch = matchSubVariation(variation, subVariation, clickomMatch.variations);

      if (!variationMatch.match) {
        notes.push({
          type: "variation-unmatched",
          variation: variation.name,
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
        variation: variation.name,
        size: subVariation.size,
        clickomVariationId: variationMatch.match.variationId,
        subSku: variationMatch.match.subSku,
        reason: variationMatch.reason,
      });

      return nextSubVariation;
    }),
  }));

  if (sanityProduct.clickomProductId !== clickomMatch.productId) {
    set.clickomProductId = clickomMatch.productId;
    hasChanges = true;
  }

  if (!sanityProduct.sku && clickomMatch.sku) {
    set.sku = clickomMatch.sku;
    hasChanges = true;
  }

  if (hasChanges) {
    set.variations = nextVariations;
  }

  return { set, hasChanges, notes };
}

function formatVariationCandidate(candidate: Record<string, unknown>) {
  const clickomVariation = candidate.clickomVariation as ClickomVariationForSync;
  return [
    `id ${clickomVariation.variationId}`,
    clickomVariation.parentName,
    clickomVariation.name,
    clickomVariation.subSku,
  ].filter(Boolean).join(" / ");
}

export function renderClickomProductSyncReport(report: ClickomProductSyncReport) {
  const lines = [
    "# Clickom Product Sync Report",
    "",
    `Mode: ${report.mode}`,
    `Generated: ${report.generatedAt}`,
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
    const candidates = Array.isArray(item.candidates) ? item.candidates as ClickomProductForSync[] : [];
    lines.push(`- ${item.title}: ${candidates.map((candidate) => `${candidate.name} (${candidate.productId})`).join(", ")}`);
  }
  if (report.productAmbiguous.length === 0) lines.push("None.");

  lines.push("", "## Variation Review", "");
  for (const item of report.variationNotes) {
    if (item.type === "variation-matched") {
      lines.push(`- ${item.productTitle}: ${item.variation} / ${item.size} -> ${item.clickomVariationId}${item.subSku ? ` (${item.subSku})` : ""} via ${item.reason}`);
      continue;
    }

    const candidates = Array.isArray(item.candidates) && item.candidates.length > 0
      ? ` Candidates: ${(item.candidates as Record<string, unknown>[]).map(formatVariationCandidate).join("; ")}`
      : "";
    lines.push(`- NEEDS REVIEW: ${item.productTitle}: ${item.variation} / ${item.size} (${item.reason}).${candidates}`);
  }
  if (report.variationNotes.length === 0) lines.push("None.");

  return `${lines.join("\n")}\n`;
}

export async function runClickomProductSync(options: { apply: boolean }) {
  const client = requireSanityWriteClient();
  const clickomProducts = await fetchClickomProducts();
  const sanityProducts = await fetchSanityProducts();
  const indexes = buildClickomIndexes(clickomProducts);
  const report: ClickomProductSyncReport = {
    mode: options.apply ? "apply" : "dry-run",
    generatedAt: new Date().toISOString(),
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

    if (options.apply) {
      await client.patch(sanityProduct._id).set(patch.set).commit();
    }
  }

  return {
    report,
    markdown: renderClickomProductSyncReport(report),
  };
}

