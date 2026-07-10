import "server-only";

const DEFAULT_CLICKOM_BASE_URL = "https://nooramodestynew.clickom.lk";
const TOKEN_CACHE_TTL_MS = 10 * 60 * 1000;
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

let cachedToken: { token: string; expiresAt: number } | null = null;

export type ClickomStatusCode = "pd" | "pc" | "oh" | "cp" | "cn" | "rf" | "fl" | "sp";
export type ClickomPaymentStatus = "paid" | "partial" | "due";

export interface ClickomSalePayload {
  invoice_no: string;
  custom_order_id: number;
  transaction_date: string;
  mobile: string;
  customer_full_name: string;
  customer_address_line_1: string;
  customer_address_line_2?: string;
  customer_city: string;
  customer_zip_code: string;
  customer_country: string;
  discount_type?: "fixed" | "percentage";
  discount_amount?: number;
  additional_notes?: string;
  status?: ClickomStatusCode;
  payment_status?: ClickomPaymentStatus;
  products: Array<{
    product_id: number;
    variation_id: number;
    quantity: number;
    unit_price: number;
    unit_price_inc_tax: number;
    enable_stock: 0 | 1;
    note?: string;
    sell_line_note?: string;
  }>;
  payment?: Array<{
    amount: number;
    method: "cash" | "bank_transfer";
    note?: string;
  }>;
}

export interface ClickomSaleResult {
  transactionId: string;
  invoiceNo: string;
  raw: unknown;
}

export interface ClickomStockResult {
  variationId: string;
  inStock: boolean;
  stock: number;
  raw: unknown;
}

export interface ClickomSaleStatusDetails {
  status: string;
  callStatus?: string;
  orderStatus?: string;
  shippingStatus?: string;
  paymentStatus?: string;
  waybillNumber?: string;
  raw: unknown;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/$/, "");
}

function getClickomConfig() {
  const baseUrl = normalizeBaseUrl(process.env.CLICKOM_BASE_URL || DEFAULT_CLICKOM_BASE_URL);
  const clientId = process.env.CLICKOM_CLIENT_ID;
  const clientSecret = process.env.CLICKOM_CLIENT_SECRET;
  const username = process.env.CLICKOM_USERNAME;
  const password = process.env.CLICKOM_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error("Clickom credentials are not configured.");
  }

  return { baseUrl, clientId, clientSecret, username, password };
}

function readToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;

  const record = data as Record<string, unknown>;
  const directToken = record.access_token || record.token || record.api_token;

  if (typeof directToken === "string" && directToken) return directToken;

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    const nestedToken = nested.access_token || nested.token || nested.api_token;
    if (typeof nestedToken === "string" && nestedToken) return nestedToken;
  }

  return null;
}

function readJwtExpiry(token: string): number | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}

async function getClickomToken(forceRefresh = false): Promise<string> {
  if (!forceRefresh && cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  const { baseUrl, clientId, clientSecret, username, password } = getClickomConfig();
  const formData = new FormData();
  formData.append("client_id", clientId);
  formData.append("client_secret", clientSecret);
  formData.append("username", username);
  formData.append("password", password);

  const response = await fetch(`${baseUrl}/api/customapi/login`, {
    method: "POST",
    headers: { accept: "application/json" },
    body: formData,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Clickom login failed.");
  }

  const token = readToken(data);

  if (!token) {
    throw new Error("Clickom login response did not include a token.");
  }

  const jwtExpiry = readJwtExpiry(token);

  cachedToken = {
    token,
    expiresAt: jwtExpiry ? jwtExpiry - TOKEN_REFRESH_BUFFER_MS : Date.now() + TOKEN_CACHE_TTL_MS,
  };

  return token;
}

async function clickomFetch(path: string, init?: RequestInit, retry = true): Promise<Response> {
  const { baseUrl } = getClickomConfig();
  const token = await getClickomToken(!retry);
  const response = await fetch(`${baseUrl}/api/customapi${path}`, {
    ...init,
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (response.status === 401 && retry) {
    cachedToken = null;
    return clickomFetch(path, init, false);
  }

  return response;
}

function isDuplicateInvoiceError(data: unknown) {
  const message = data && typeof data === "object" ? String((data as Record<string, unknown>).message || "") : "";
  return /duplicate/i.test(message) && /(invoice|custom[_\s-]?order|order)/i.test(message);
}

function isSkippedSale(data: unknown) {
  if (!data || typeof data !== "object") return false;
  const record = data as Record<string, unknown>;
  return record.skipped === true || (record.success === false && record.status_code === 422);
}

function readClickomMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  const message = typeof record.message === "string" && record.message ? record.message : fallback;

  if (record.errors && typeof record.errors === "object") {
    return `${message}: ${JSON.stringify(record.errors)}`;
  }

  return message;
}

function extractTransactionId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const value = record.transaction_id || record.id || record.sale_id;

  if (typeof value === "string" || typeof value === "number") return String(value);

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    const nestedValue = nested.transaction_id || nested.id || nested.sale_id;
    if (typeof nestedValue === "string" || typeof nestedValue === "number") return String(nestedValue);
  }

  return null;
}

function extractInvoiceNo(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const record = data as Record<string, unknown>;
  const value = record.invoice_no;

  if (typeof value === "string" && value) return value;

  if (record.data && typeof record.data === "object") {
    const nested = record.data as Record<string, unknown>;
    if (typeof nested.invoice_no === "string" && nested.invoice_no) return nested.invoice_no;
  }

  return fallback;
}

async function postClickomSale(payload: ClickomSalePayload): Promise<ClickomSaleResult> {
  const response = await clickomFetch("/sales", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (isSkippedSale(data)) {
    const error = new Error(readClickomMessage(data, "Clickom skipped the sale."));
    error.cause = data;
    throw error;
  }

  if (!response.ok) {
    const duplicatePrefix = isDuplicateInvoiceError(data) ? "Clickom duplicate sale: " : "";
    const error = new Error(`${duplicatePrefix}${readClickomMessage(data, "Clickom sale creation failed.")}`);
    error.cause = data;
    throw error;
  }

  return {
    transactionId: extractTransactionId(data) || payload.invoice_no,
    invoiceNo: extractInvoiceNo(data, payload.invoice_no),
    raw: data,
  };
}

export async function createClickomSale(payload: ClickomSalePayload): Promise<ClickomSaleResult> {
  return postClickomSale(payload);
}

export async function updateClickomSale(payload: ClickomSalePayload): Promise<ClickomSaleResult> {
  const response = await clickomFetch(`/sales/${encodeURIComponent(payload.custom_order_id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(readClickomMessage(data, "Clickom sale update failed."));
  }

  return {
    transactionId: extractTransactionId(data) || String(payload.custom_order_id),
    invoiceNo: extractInvoiceNo(data, payload.invoice_no),
    raw: data,
  };
}

export async function getClickomStock(variationId: string): Promise<ClickomStockResult> {
  const response = await clickomFetch(`/stocks/${encodeURIComponent(variationId)}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Clickom stock lookup failed.");
  }

  const stockEntries =
    data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).data)
      ? ((data as Record<string, unknown>).data as Array<Record<string, unknown>>)
      : data && typeof data === "object"
        ? [data as Record<string, unknown>]
        : [];
  const stockValue = stockEntries.reduce((sum, entry) => {
    const qty = Number(entry.qty_available ?? 0);
    return sum + (Number.isFinite(qty) ? qty : 0);
  }, 0);
  const stock = Number.isFinite(stockValue) ? stockValue : 0;

  return {
    variationId,
    stock,
    inStock: stock > 0,
    raw: data,
  };
}

export async function getClickomSaleStatus(orderId: string): Promise<string> {
  const response = await clickomFetch(
    `/sales_status/${encodeURIComponent(orderId)}`,
  );
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Clickom status sync failed.");
  }

  return String(data?.status || data?.data?.status || "processing");
}

function readNestedString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number") return String(value);
  }

  return undefined;
}

export async function getClickomSaleStatusDetails(orderId: string): Promise<ClickomSaleStatusDetails> {
  const response = await clickomFetch(`/sales_status/${encodeURIComponent(orderId)}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Clickom status sync failed.");
  }

  const root = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const details = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : root;
  const status = readNestedString(details, ["status", "order_status"]) || "pending";

  return {
    status,
    callStatus: readNestedString(details, ["call_status", "callStatus"]),
    orderStatus: readNestedString(details, ["order_status", "orderStatus"]),
    shippingStatus: readNestedString(details, ["shipping_status", "shippingStatus", "delivery_status"]),
    paymentStatus: readNestedString(details, ["payment_status", "paymentStatus"]),
    waybillNumber: readNestedString(details, ["waybill_no", "waybill", "waybill_number", "waybillNumber"]),
    raw: data,
  };
}

export async function setClickomSaleStatus(payload: ClickomSalePayload, status: ClickomStatusCode): Promise<ClickomSaleResult> {
  return updateClickomSale({ ...payload, status });
}
