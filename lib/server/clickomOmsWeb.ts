import "server-only";

import { buildClickomCustomOrderId } from "@/lib/server/clickomOrderPayload";
import { SanityOrder } from "@/types/sanityOrder";

const DEFAULT_CLICKOM_BASE_URL = "https://nooramodestynew.clickom.lk";
const WEB_ORDER_RESOURCE_ID = "7";
const CITYPACK_COURIER_ID = "1";
const DEFAULT_BUSINESS_LOCATION_ID = "1";
const DEFAULT_CUSTOMER_ID = "1";
const DEFAULT_UNIT_ID = "1";

interface ClickomWebSession {
  baseUrl: string;
  cookie: string;
  token: string;
}

export interface ClickomOmsOrderResult {
  transactionId: string;
  invoiceNo: string;
  customOrderId: number;
  raw: {
    orderId?: string;
    finalTotal: number;
    paidAmount: number;
    balanceAmount: number;
    contactId: string;
  };
}

type HeadersWithGetSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/api\/customapi\/?$/, "").replace(/\/$/, "");
}

function getClickomWebConfig() {
  const baseUrl = normalizeBaseUrl(process.env.CLICKOM_BASE_URL || DEFAULT_CLICKOM_BASE_URL);
  const username = process.env.CLICKOM_USERNAME;
  const password = process.env.CLICKOM_PASSWORD;

  if (!username || !password) {
    throw new Error("Clickom username/password are not configured.");
  }

  return { baseUrl, username, password };
}

function readSetCookie(headers: Headers) {
  const getSetCookie = (headers as HeadersWithGetSetCookie).getSetCookie;
  const setCookies = getSetCookie ? getSetCookie.call(headers) : [];
  const fallback = headers.get("set-cookie");

  if (setCookies.length) return setCookies;
  if (!fallback) return [];

  return fallback.split(/,(?=[^;,]+=)/);
}

function mergeCookies(currentCookie: string, headers: Headers) {
  const cookies = new Map<string, string>();

  currentCookie
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [name, ...valueParts] = part.split("=");
      if (name && valueParts.length) cookies.set(name, valueParts.join("="));
    });

  readSetCookie(headers).forEach((setCookie) => {
    const [pair] = setCookie.split(";");
    const [name, ...valueParts] = pair.split("=");
    if (name && valueParts.length) cookies.set(name.trim(), valueParts.join("=").trim());
  });

  return Array.from(cookies.entries()).map(([name, value]) => `${name}=${value}`).join("; ");
}

function extractCsrfToken(html: string) {
  const inputMatch = html.match(/name=["']_token["'][^>]*value=["']([^"']+)["']/i);
  if (inputMatch?.[1]) return inputMatch[1];

  const metaMatch = html.match(/name=["']csrf-token["'][^>]*content=["']([^"']+)["']/i);
  if (metaMatch?.[1]) return metaMatch[1];

  throw new Error("Clickom page did not include a CSRF token.");
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
    if (typeof value === "number") return String(value);
  }

  return undefined;
}

function extractIdFromRecord(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const id = readString(record, ["id", "contact_id", "value"]);
  if (id) return id;

  const data = record.data;
  if (data && typeof data === "object") return extractIdFromRecord(data);

  return null;
}

function extractFirstId(value: unknown): string | null {
  const directId = extractIdFromRecord(value);
  if (directId) return directId;

  if (Array.isArray(value)) {
    for (const item of value) {
      const id = extractFirstId(item);
      if (id) return id;
    }
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const key of ["results", "items", "data"]) {
      const id = extractFirstId(record[key]);
      if (id) return id;
    }
  }

  return null;
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("94") && digits.length === 11) return `0${digits.slice(2)}`;
  if (digits.length === 9) return `0${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return digits;

  return digits.slice(-10);
}

function normalizeLabel(label: string) {
  return label
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function findCityId(html: string, city: string) {
  const normalizedCity = normalizeLabel(city || "Colombo");
  const options = Array.from(html.matchAll(/<option\s+value=["']([^"']+)["'][^>]*>([^<]+)<\/option>/gi));
  const exactMatch = options.find(([, , label]) => normalizeLabel(label) === normalizedCity);
  if (exactMatch?.[1]) return exactMatch[1];

  const containedMatch = options.find(([, , label]) => normalizeLabel(label).includes(normalizedCity));
  if (containedMatch?.[1]) return containedMatch[1];

  const colomboMatch = options.find(([, , label]) => normalizeLabel(label) === "colombo");
  return colomboMatch?.[1] || DEFAULT_CUSTOMER_ID;
}

function formatMoney(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0).toFixed(2);
}

function formatQuantity(value: number) {
  return Math.max(1, Number.isFinite(value) ? value : 1).toFixed(2);
}

function formatDateTime(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${month}/${day}/${year} ${hours}:${minutes}`;
}

function calculateProductSubtotal(order: SanityOrder) {
  return order.items.reduce((total, item) => total + Math.max(0, item.unitPrice || 0) * Math.max(1, item.quantity || 1), 0);
}

function calculateShipping(order: SanityOrder) {
  const subtotal = calculateProductSubtotal(order);
  const discount = Math.max(0, order.discountAmount || 0);
  return Math.max(0, Math.round((Math.max(0, order.totalAmount || 0) - subtotal + discount) * 100) / 100);
}

function buildCustomSizeNote(item: SanityOrder["items"][number]) {
  if (!item.customSize) return "";

  const quantity = Math.max(1, item.quantity || 1);
  const measurements = [
    item.customLength ? `length: ${item.customLength}` : "",
    item.customBust ? `bust: ${item.customBust}` : "",
    item.customHip ? `hip: ${item.customHip}` : "",
    item.customSleeve ? `sleeve: ${item.customSleeve}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return `${item.title} - custom size x${quantity} pcs${measurements ? ` (${measurements})` : ""}`;
}

function buildOrderNote(order: SanityOrder) {
  return order.items
    .map((item) => buildCustomSizeNote(item))
    .filter(Boolean)
    .join("\n");
}

function appendProduct(params: URLSearchParams, row: number, item: SanityOrder["items"][number]) {
  const prefix = `products[${row}]`;
  const quantity = Math.max(1, item.quantity || 1);
  const price = Math.max(0, item.unitPrice || 0);
  const note = buildCustomSizeNote(item);

  params.set(`${prefix}[product_type]`, "variable");
  params.set(`${prefix}[product_id]`, String(item.clickomProductId));
  params.set(`${prefix}[variation_id]`, String(item.clickomVariationId));
  params.set(`${prefix}[enable_stock]`, "1");
  params.set(`${prefix}[quantity]`, formatQuantity(quantity));
  params.set(`${prefix}[product_unit_id]`, DEFAULT_UNIT_ID);
  params.set(`${prefix}[sub_unit_id]`, DEFAULT_UNIT_ID);
  params.set(`${prefix}[base_unit_multiplier]`, "1");
  params.set(`${prefix}[unit_price]`, formatMoney(price));
  params.set(`${prefix}[line_discount_type]`, "fixed");
  params.set(`${prefix}[line_discount_amount]`, "0.00");
  params.set(`${prefix}[item_tax]`, "0.00");
  params.set(`${prefix}[tax_id]`, "");
  params.set(`${prefix}[sell_line_note]`, note);
  params.set(`${prefix}[unit_price_inc_tax]`, formatMoney(price));
  params.set(`${prefix}[base_unit_price]`, formatMoney(price));
  params.set(`${prefix}[base_unit_price_inc_tax]`, formatMoney(price));
  params.set(`${prefix}[sell_line_note_text]`, note);
}

async function clickomFetch(session: ClickomWebSession, path: string, init?: RequestInit) {
  const response = await fetch(`${session.baseUrl}${path}`, {
    ...init,
    headers: {
      cookie: session.cookie,
      origin: session.baseUrl,
      referer: `${session.baseUrl}/ordermanagement/order/create`,
      ...init?.headers,
    },
    cache: "no-store",
  });

  session.cookie = mergeCookies(session.cookie, response.headers);
  return response;
}

async function loginToClickom(): Promise<ClickomWebSession> {
  const { baseUrl, username, password } = getClickomWebConfig();
  let cookie = "";

  const loginPage = await fetch(`${baseUrl}/login`, { cache: "no-store" });
  cookie = mergeCookies(cookie, loginPage.headers);
  const loginHtml = await loginPage.text();
  const token = extractCsrfToken(loginHtml);
  const loginParams = new URLSearchParams();
  loginParams.set("_token", token);
  loginParams.set("username", username);
  loginParams.set("password", password);
  loginParams.set("remember", "1");

  const loginResponse = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie,
      origin: baseUrl,
      referer: `${baseUrl}/login`,
    },
    body: loginParams,
    redirect: "manual",
    cache: "no-store",
  });
  cookie = mergeCookies(cookie, loginResponse.headers);

  if (![200, 302, 303].includes(loginResponse.status)) {
    throw new Error(`Clickom web login failed with status ${loginResponse.status}.`);
  }

  return { baseUrl, cookie, token };
}

async function loadOrderCreatePage(session: ClickomWebSession) {
  const response = await clickomFetch(session, "/ordermanagement/order/create");
  const html = await response.text();

  if (!response.ok || !html.includes("add_sell_form")) {
    throw new Error("Clickom OMS order form could not be loaded.");
  }

  session.token = extractCsrfToken(html);
  return html;
}

async function findContactId(session: ClickomWebSession, mobile: string) {
  const query = encodeURIComponent(mobile);
  const response = await clickomFetch(session, `/contacts/online-customers?q=${query}`);
  const data = await response.json().catch(() => null);

  if (!response.ok) return null;
  return extractFirstId(data);
}

async function createContact(session: ClickomWebSession, order: SanityOrder, createPageHtml: string) {
  const mobile = normalizePhone(order.customer.mobile);
  const cityId = findCityId(createPageHtml, order.customer.city);
  const address = [order.customer.addressLine1, order.customer.addressLine2, order.customer.city, order.customer.district]
    .filter(Boolean)
    .join(", ");
  const params = new URLSearchParams();
  params.set("_token", session.token);
  params.set("type", "online_customer");
  params.set("contact_type", "individual");
  params.set("first_name", order.customer.fullName || "Online Customer");
  params.set("mobile", mobile);
  params.set("address_line_1", order.customer.addressLine1 || address || "Online order");
  params.set("city", cityId);
  params.set("shipping_address", address);

  const response = await clickomFetch(session, "/contacts", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded",
      "x-csrf-token": session.token,
      "x-requested-with": "XMLHttpRequest",
    },
    body: params,
    redirect: "manual",
  });
  const data = await response.json().catch(() => null);
  const id = extractFirstId(data);

  if (id) return id;

  const foundId = await findContactId(session, mobile);
  if (foundId) return foundId;

  if (!response.ok) {
    throw new Error("Clickom contact creation failed.");
  }

  return DEFAULT_CUSTOMER_ID;
}

async function resolveContactId(session: ClickomWebSession, order: SanityOrder, createPageHtml: string) {
  const mobile = normalizePhone(order.customer.mobile);
  const existingId = await findContactId(session, mobile);
  if (existingId) return existingId;

  return createContact(session, order, createPageHtml);
}

function buildOmsOrderParams(order: SanityOrder, contactId: string) {
  const productSubtotal = calculateProductSubtotal(order);
  const discount = Math.max(0, order.discountAmount || 0);
  const shipping = calculateShipping(order);
  const finalTotal = Math.max(0, order.totalAmount || productSubtotal + shipping - discount);
  const paidAmount = 0;
  const paymentMethod = order.paymentMethod === "bank_transfer" ? "bank_transfer" : "cod";
  const params = new URLSearchParams();

  params.set("_token", "");
  params.set("type", "sell");
  params.set("location_id", DEFAULT_BUSINESS_LOCATION_ID);
  params.set("price_group", "0");
  params.set("default_price_group", "0");
  params.set("contact_id", contactId);
  params.set("transaction_date", formatDateTime(new Date()));
  params.set("invoice_no", order.orderNumber);
  params.set("status", "final");
  params.set("resource", WEB_ORDER_RESOURCE_ID);
  params.set("courier_id", CITYPACK_COURIER_ID);
  params.set("courier_charge_id", formatMoney(shipping));
  params.set("call_status", "pending");
  params.set("sell_price_tax", "includes");
  params.set("discount_type", discount > 0 ? "fixed" : "percentage");
  params.set("discount_amount", formatMoney(discount));
  params.set("rp_redeemed", "0");
  params.set("rp_redeemed_amount", "0");
  params.set("tax_rate_id", "");
  params.set("tax_calculation_amount", "0.00");
  params.set("shipping_details", "");
  params.set("shipping_address", [
    order.customer.fullName,
    order.customer.addressLine1,
    order.customer.addressLine2,
    order.customer.city,
    order.customer.district,
  ].filter(Boolean).join(", "));
  params.set("shipping_status", "ordered");
  params.set("delivered_to", "");
  params.set("additional_notes", buildOrderNote(order));
  params.set("staff_note", "");
  params.set("is_suspend", "0");
  params.set("recur_interval", "");
  params.set("recur_interval_type", "days");
  params.set("recur_repetitions", "");
  params.set("subscription_repeat_on", "");
  params.set("final_total", formatMoney(finalTotal));
  params.set("is_direct_sale", "1");
  params.set("is_order", "1");
  params.set("convenience_fee_type", "fixed");
  params.set("convenience_fee_amount", "0");
  params.set("convenience_fee_calculation_type", "fixed");
  params.set("payment[0][amount]", formatMoney(paidAmount));
  params.set("payment[0][paid_on]", formatDateTime(new Date()));
  params.set("payment[0][method]", paymentMethod);
  params.set("prefer_payment_method", paymentMethod);
  params.set("payment[0][account_id]", "");
  params.set("payment[0][card_transaction_number]", "");
  params.set("payment[0][card_number]", "");
  params.set("payment[0][card_type]", "credit");
  params.set("payment[0][card_holder_name]", "");
  params.set("payment[0][card_month]", "");
  params.set("payment[0][card_year]", "");
  params.set("payment[0][card_security]", "");
  params.set("payment[0][cheque_number]", "");
  params.set("payment[0][bank_account_number]", "");
  params.set("payment[0][transaction_no_1]", "");
  params.set("payment[0][transaction_no_2]", "");
  params.set("payment[0][transaction_no_3]", "");
  params.set("payment[0][note]", paidAmount > 0 ? "Verified by Noora Modesty" : "COD from Noora Modesty");
  params.set("change_return", "0");
  params.set("payment[change_return][method]", "cash");
  params.set("payment[change_return][account_id]", "");
  params.set("payment[change_return][card_transaction_number]", "");
  params.set("payment[change_return][card_number]", "");
  params.set("payment[change_return][card_type]", "credit");
  params.set("payment[change_return][card_holder_name]", "");
  params.set("payment[change_return][card_month]", "");
  params.set("payment[change_return][card_year]", "");
  params.set("payment[change_return][card_security]", "");
  params.set("payment[change_return][cheque_number]", "");
  params.set("payment[change_return][bank_account_number]", "");
  params.set("payment[change_return][transaction_no_1]", "");
  params.set("payment[change_return][transaction_no_2]", "");
  params.set("payment[change_return][transaction_no_3]", "");
  params.set("payment[change_return][note]", "");
  params.set("is_save_and_print", "0");

  order.items.forEach((item, index) => appendProduct(params, index + 1, item));

  return {
    params,
    finalTotal,
    paidAmount,
    balanceAmount: Math.max(0, finalTotal - paidAmount),
  };
}

function extractOrderIdFromList(html: string, invoiceNo: string) {
  const invoiceIndex = html.indexOf(invoiceNo);
  if (invoiceIndex < 0) return undefined;

  const start = Math.max(0, invoiceIndex - 3000);
  const end = Math.min(html.length, invoiceIndex + 3000);
  const scope = html.slice(start, end);
  const match = scope.match(/ordermanagement\/order\/(\d+)/);

  return match?.[1];
}

async function findOmsOrderId(session: ClickomWebSession, invoiceNo: string) {
  const response = await clickomFetch(session, `/ordermanagement/order?search=${encodeURIComponent(invoiceNo)}`);
  const html = await response.text();
  if (!response.ok) return undefined;

  return extractOrderIdFromList(html, invoiceNo);
}

export async function createClickomOmsWebOrder(order: SanityOrder): Promise<ClickomOmsOrderResult> {
  const session = await loginToClickom();
  const createPageHtml = await loadOrderCreatePage(session);
  const contactId = await resolveContactId(session, order, createPageHtml);
  const builtOrder = buildOmsOrderParams(order, contactId);
  builtOrder.params.set("_token", session.token);

  const response = await clickomFetch(session, "/ordermanagement/order", {
    method: "POST",
    headers: {
      accept: "text/html,application/xhtml+xml,application/json",
      "content-type": "application/x-www-form-urlencoded",
      "x-csrf-token": session.token,
      "x-requested-with": "XMLHttpRequest",
    },
    body: builtOrder.params,
    redirect: "manual",
  });
  const responseText = await response.text().catch(() => "");

  if (![200, 302, 303].includes(response.status)) {
    throw new Error(`Clickom OMS order creation failed with status ${response.status}.`);
  }

  let responseJson: { success?: boolean; msg?: string; error?: string } | null = null;
  try {
    responseJson = JSON.parse(responseText);
  } catch {
    responseJson = null;
  }

  if (responseJson && responseJson.success === false) {
    throw new Error(`Clickom OMS order creation failed: ${responseJson.msg || responseJson.error || "Unknown error."}`);
  }

  const orderId = await findOmsOrderId(session, order.orderNumber);

  if (!orderId) {
    throw new Error("Clickom OMS order creation could not be confirmed — the order was not found in the OMS order list afterward.");
  }

  const customOrderId = order.clickomCustomOrderId || buildClickomCustomOrderId(order.orderNumber);

  return {
    transactionId: orderId || order.orderNumber,
    invoiceNo: order.orderNumber,
    customOrderId,
    raw: {
      orderId,
      finalTotal: builtOrder.finalTotal,
      paidAmount: builtOrder.paidAmount,
      balanceAmount: builtOrder.balanceAmount,
      contactId,
    },
  };
}

export interface ClickomOmsTracking {
  waybillNumber?: string;
  waybillPrintStatus?: string;
  deliveryStatus?: string;
  callStatus?: string;
}

export interface ClickomOmsOrderDetail {
  amountPayable: number;
  items: Array<{
    title: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

// Attribute order isn't consistent across this form's inputs (some put `value` before `name`,
// some after), so both orders are tried rather than assuming one.
function extractInputValue(html: string, name: string) {
  const escaped = name.replace(/[[\]]/g, (char) => `\\${char}`);
  const forward = new RegExp(`name=["']${escaped}["'][^>]*value=["']([^"']*)["']`, "i");
  const backward = new RegExp(`value=["']([^"']*)["'][^>]*name=["']${escaped}["']`, "i");
  return html.match(forward)?.[1] ?? html.match(backward)?.[1];
}

function parseMoney(value: string | undefined) {
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function stripHtmlToText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

// The OMS order list is rendered server-side as an HTML table. Column positions are read from
// the <thead> rather than hardcoded, so a reordered or newly inserted column doesn't quietly
// make us read the wrong cell — the whole reason to anchor on header text.
function readOrderListColumnIndexes(html: string) {
  const theadStart = html.indexOf("<thead");
  const theadEnd = html.indexOf("</thead>", theadStart);
  if (theadStart < 0 || theadEnd < 0) return {};

  const headers = [...html.slice(theadStart, theadEnd).matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((match) =>
    stripHtmlToText(match[1]).toLowerCase(),
  );
  const find = (predicate: (header: string) => boolean) => {
    const index = headers.findIndex(predicate);
    return index >= 0 ? index : undefined;
  };

  return {
    waybill: find((header) => header.includes("waybill") && !header.includes("print")),
    waybillPrint: find((header) => header.includes("waybill") && header.includes("print")),
    deliveryStatus: find((header) => header.includes("delivery") && header.includes("status")),
    callStatus: find((header) => header.includes("call") && header.includes("status")),
  };
}

// The exact invoice string only appears inside its own order row, so the enclosing <tr> is the
// order we searched for.
function extractOrderRow(html: string, invoiceNo: string) {
  const invoiceIndex = html.indexOf(invoiceNo);
  if (invoiceIndex < 0) return null;

  const rowStart = html.lastIndexOf("<tr", invoiceIndex);
  const rowEnd = html.indexOf("</tr>", invoiceIndex);
  if (rowStart < 0 || rowEnd < 0) return null;

  return html.slice(rowStart, rowEnd + "</tr>".length);
}

function cleanCellValue(value: string | undefined) {
  const trimmed = (value || "").trim();
  return trimmed && trimmed !== "-" ? trimmed : undefined;
}

/**
 * Reads courier tracking for a web-created OMS order by scraping the order management list.
 *
 * Orders placed through the OMS web flow are not indexed by the REST `sales_status` endpoint
 * (it 404s on their custom_order_id), and the waybill Citypak assigns is only ever surfaced in
 * this list. Returns null when the order can't be found; an order without a waybill yet returns
 * a result with `waybillNumber` undefined.
 */
export async function getClickomOmsTracking(invoiceNo: string): Promise<ClickomOmsTracking | null> {
  const trimmedInvoice = invoiceNo.trim();
  if (!trimmedInvoice) return null;

  const session = await loginToClickom();
  const response = await clickomFetch(
    session,
    `/ordermanagement/order?search=${encodeURIComponent(trimmedInvoice)}`,
  );
  if (!response.ok) return null;

  const html = await response.text();
  const row = extractOrderRow(html, trimmedInvoice);
  if (!row) return null;

  const columns = readOrderListColumnIndexes(html);
  const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => stripHtmlToText(match[1]));
  const cellAt = (index: number | undefined) => (typeof index === "number" ? cells[index] : undefined);

  return {
    waybillNumber: cleanCellValue(cellAt(columns.waybill)),
    waybillPrintStatus: cleanCellValue(cellAt(columns.waybillPrint)),
    deliveryStatus: cleanCellValue(cellAt(columns.deliveryStatus)),
    callStatus: cleanCellValue(cellAt(columns.callStatus)),
  };
}

/**
 * Reads the authoritative order state directly off the Clickom OMS "Edit Order" page — line
 * items and the amount still payable — rather than the Sanity snapshot taken at checkout.
 *
 * This exists because staff can merge a customer's follow-up phone order into an existing
 * invoice directly in the OMS, which Sanity never learns about. The "Customer Due" figure on
 * this page is order-scoped and already nets off delivery fee and any payments recorded against
 * the invoice, so it doubles as "amount payable" without us re-deriving totals ourselves.
 *
 * Fragile by nature: this parses an internal admin-panel template Clickom could change without
 * notice. Callers should treat a null/thrown result as "fall back to the Sanity snapshot."
 */
export async function getClickomOmsOrderDetail(invoiceNo: string): Promise<ClickomOmsOrderDetail | null> {
  const trimmedInvoice = invoiceNo.trim();
  if (!trimmedInvoice) return null;

  const session = await loginToClickom();
  const orderId = await findOmsOrderId(session, trimmedInvoice);
  if (!orderId) return null;

  const response = await clickomFetch(session, `/ordermanagement/order/${orderId}/edit`);
  if (!response.ok) return null;

  const html = await response.text();
  const dueMatch = html.match(/contact_due_text[\s\S]{0,200}?<span>([^<]+)<\/span>/i);
  const amountPayable = parseMoney(dueMatch?.[1]);

  const items = [...html.matchAll(/<tr class="product_row" data-row_index="(\d+)"[^>]*>([\s\S]*?)<\/tr>/g)].map(
    ([, rowIndex, rowHtml]) => {
      const nameBlock = rowHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "";
      const [titlePart, skuPart] = nameBlock.split(/<br\s*\/?>/i);

      return {
        title: stripHtmlToText(titlePart || ""),
        sku: stripHtmlToText(skuPart || "") || undefined,
        quantity: parseMoney(extractInputValue(rowHtml, `products[${rowIndex}][quantity]`)) || 1,
        unitPrice: parseMoney(extractInputValue(rowHtml, `products[${rowIndex}][unit_price]`)),
        lineTotal: parseMoney(rowHtml.match(/pos_line_total_text[^>]*>([^<]+)</i)?.[1]),
      };
    },
  );

  return { amountPayable, items };
}
