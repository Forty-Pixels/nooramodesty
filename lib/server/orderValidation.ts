import "server-only";

import { z, ZodError } from "zod";
import { sanityClient } from "@/lib/sanity/client";
import { getLiveClickomStock } from "@/lib/server/clickom";
import { calculateShippingQuote, DEFAULT_SITE_SETTINGS } from "@/lib/shipping";
import {
  CheckoutOrderPayload,
  Coupon,
  OrderItemInput,
  OrderItemSnapshot,
  OrderTotals,
} from "@/types/order";
import { PublicSiteSettings } from "@/types/siteSettings";

const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;
const optionalString = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().trim().optional(),
);
const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim().length === 0 ? undefined : value),
  z.string().trim().email({ error: "Please enter a valid email address." }).optional(),
);

function isValidPhoneNumber(value: string): boolean {
  const digitCount = value.replace(/\D/g, "").length;
  return PHONE_PATTERN.test(value) && digitCount >= 7 && digitCount <= 15;
}

const orderItemInputSchema = z.object({
  productId: z.string({ error: "Product is required." }).trim().min(1, { error: "Product is required." }),
  clickomVariationId: z.coerce.number({ error: "Please choose a valid size for every item." }).int({ error: "Please choose a valid size for every item." }).positive({ error: "Please choose a valid size for every item." }),
  quantity: z.coerce.number({ error: "Item quantity is required." }).int({ error: "Item quantity must be a whole number." }).min(1, { error: "Item quantity must be at least 1." }).max(20, { error: "Item quantity cannot be more than 20." }),
  selectedColor: optionalString,
  selectedColorHex: optionalString,
  size: optionalString,
  selectedSize: optionalString,
  sku: optionalString,
  customSize: z.boolean({ error: "Custom size selection is invalid." }).default(false),
  preOrder: z.boolean().optional(),
  customLength: optionalString,
  customBust: optionalString,
  customHip: optionalString,
  customSleeve: optionalString,
  customNote: optionalString,
});

export const checkoutOrderSchema = z.object({
  customer: z.object({
    fullName: z.string({ error: "Full name is required." }).trim().min(2, { error: "Full name must be at least 2 characters." }),
    mobile: z.string({ error: "Phone number is required." }).trim().refine(isValidPhoneNumber, {
      error: "Phone number must contain 7 to 15 digits and no letters.",
    }),
    whatsapp: z.preprocess(
      (value) => (value === null || value === "" ? undefined : value),
      z.string().trim().refine(isValidPhoneNumber, {
        error: "WhatsApp number must contain 7 to 15 digits and no letters.",
      }).optional(),
    ),
    email: optionalEmail,
    addressLine1: z.string({ error: "Address is required." }).trim().min(3, { error: "Address must be at least 3 characters." }),
    addressLine2: z.string().trim().optional(),
    city: z.string({ error: "City is required." }).trim().min(2, { error: "City must be at least 2 characters." }),
    district: z.string({ error: "District is required." }).trim().min(2, { error: "District must be at least 2 characters." }),
  }),
  items: z.array(orderItemInputSchema).min(1, { error: "Your bag is empty." }),
  paymentMethod: z.enum(["cod", "bank_transfer"], { error: "Please choose a valid payment method." }),
  couponCode: z.string().trim().optional(),
});

export const couponValidationSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, { error: "Your bag is empty." }),
  couponCode: z.string({ error: "Enter a coupon code." }).trim().min(1, { error: "Enter a coupon code." }),
});

export function formatCheckoutValidationErrors(error: ZodError): string[] {
  const messages = error.issues.map((issue) => issue.message);
  return Array.from(new Set(messages.length > 0 ? messages : ["Invalid order details."]));
}

interface ProductForOrder {
  _id: string;
  title: string;
  slug: string;
  mainImage?: string;
  price: number;
  salePrice?: number;
  isVisible?: boolean;
  clickomProductId?: number;
  enablePreOrders?: boolean;
  subVariations?: Array<{
    size: string;
    sku?: string;
    clickomVariationId?: number;
  }>;
}

export function parseCheckoutPayload(payload: unknown): CheckoutOrderPayload {
  return checkoutOrderSchema.parse(payload);
}

async function fetchProducts(productIds: string[]): Promise<ProductForOrder[]> {
  if (!sanityClient) {
    throw new Error("Sanity is not configured.");
  }

  return sanityClient.fetch<ProductForOrder[]>(
    `*[_type == "product" && _id in $ids]{
      _id,
      title,
      "slug": slug.current,
      "mainImage": mainImage.asset->url,
      price,
      salePrice,
      isVisible,
      clickomProductId,
      enablePreOrders,
      subVariations[]{
        size,
        sku,
        clickomVariationId
      }
    }`,
    { ids: productIds },
    { next: { revalidate: 0 } },
  );
}

function formatCustomSizeLabel(input: OrderItemInput): string {
  if (!input.customSize) {
    return input.size || input.selectedSize || "";
  }

  const measurements = [
    input.customLength ? `Length ${input.customLength}` : "",
    input.customBust ? `Bust ${input.customBust}` : "",
    input.customHip ? `Hip ${input.customHip}` : "",
    input.customSleeve ? `Sleeve ${input.customSleeve}` : "",
  ].filter(Boolean);

  return measurements.length > 0 ? `Custom (${measurements.join(", ")})` : "Custom";
}

async function validateItem(
  input: OrderItemInput,
  product: ProductForOrder,
  siteSettings: PublicSiteSettings = DEFAULT_SITE_SETTINGS,
): Promise<OrderItemSnapshot> {
  if (product.isVisible === false) {
    throw new Error(`${product.title} is not available.`);
  }

  const matchingSubVariation = product.subVariations?.find(
    (subVariation) => subVariation.clickomVariationId === input.clickomVariationId,
  );

  if (product.subVariations?.length && !matchingSubVariation) {
    throw new Error(`${product.title} has an invalid size selection.`);
  }

  if (!product.clickomProductId) {
    throw new Error(`${product.title} is missing a Clickom product ID.`);
  }

  const isPreOrderEligible = input.preOrder || product.enablePreOrders || input.customSize;

  // Authoritative, uncached: a stale number here would let the order oversell.
  if (!isPreOrderEligible && input.clickomVariationId) {
    const stock = await getLiveClickomStock(String(input.clickomVariationId));

    if (stock.stock < input.quantity) {
      const sizeLabel = matchingSubVariation?.size ? ` (${matchingSubVariation.size})` : "";

      throw new Error(
        stock.stock <= 0
          ? `Sorry — ${product.title}${sizeLabel} just sold out. Please remove it from your bag to continue.`
          : `Sorry — only ${stock.stock} left of ${product.title}${sizeLabel}. Please lower the quantity to continue.`,
      );
    }
  }

  const unitPrice = product.salePrice || product.price;
  const customCharge = input.customSize ? siteSettings.customSizeCharge : 0;
  const resolvedSize = input.customSize
    ? formatCustomSizeLabel(input)
    : input.size || input.selectedSize || matchingSubVariation?.size;
  const resolvedSku = input.sku || matchingSubVariation?.sku;

  return {
    ...input,
    title: product.title,
    slug: product.slug,
    image: product.mainImage,
    size: resolvedSize,
    selectedSize: resolvedSize,
    sku: resolvedSku,
    preOrder: input.preOrder || product.enablePreOrders || input.customSize,
    clickomProductId: product.clickomProductId,
    unitPrice: unitPrice + customCharge,
  };
}

export async function buildOrderItems(
  items: OrderItemInput[],
  siteSettings: PublicSiteSettings = DEFAULT_SITE_SETTINGS,
): Promise<OrderItemSnapshot[]> {
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = await fetchProducts(productIds);
  const productById = new Map(products.map((product) => [product._id, product]));

  return Promise.all(
    items.map((item) => {
      const product = productById.get(item.productId);

      if (!product) {
        throw new Error("One or more products are no longer available.");
      }

      return validateItem(item, product, siteSettings);
    }),
  );
}

export function calculateBaseTotals(
  items: OrderItemSnapshot[],
  siteSettings: PublicSiteSettings = DEFAULT_SITE_SETTINGS,
): Omit<OrderTotals, "discountAmount" | "totalAmount"> {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const shipping = calculateShippingQuote(itemQuantity, siteSettings).shipping;

  return { subtotal, shipping };
}

export async function findCoupon(code: string | undefined): Promise<Coupon | null> {
  const normalizedCode = code?.trim().toUpperCase();

  if (!normalizedCode || !sanityClient) {
    return null;
  }

  return sanityClient.fetch<Coupon | null>(
    `*[_type == "coupon" && upper(code) == $code][0]{
      _id,
      code,
      discountType,
      discountValue,
      isActive,
      startsAt,
      expiresAt,
      usesCount,
      maxUses,
      minimumSubtotal,
      "appliesToProductIds": appliesToProducts[]._ref
    }`,
    { code: normalizedCode },
    { next: { revalidate: 0 } },
  );
}

export function calculateCouponDiscount(
  coupon: Coupon | null,
  items: OrderItemSnapshot[],
  subtotal: number,
): number {
  if (!coupon) {
    return 0;
  }

  const now = Date.now();
  const startsAt = coupon.startsAt ? Date.parse(coupon.startsAt) : null;
  const expiresAt = coupon.expiresAt ? Date.parse(coupon.expiresAt) : null;

  if (coupon.isActive === false) throw new Error("Coupon is inactive.");
  if (startsAt && startsAt > now) throw new Error("Coupon is not active yet.");
  if (expiresAt && expiresAt < now) throw new Error("Coupon has expired.");
  if (coupon.maxUses && (coupon.usesCount || 0) >= coupon.maxUses) throw new Error("Coupon has reached its usage limit.");

  let eligibleAmount = subtotal;

  if (coupon.appliesToProductIds && coupon.appliesToProductIds.length > 0) {
    const allowedProductIds = new Set(coupon.appliesToProductIds);
    const matchingItems = items.filter((item) => allowedProductIds.has(item.productId));

    if (matchingItems.length === 0) {
      throw new Error("This coupon only applies to specific products that aren't in your bag.");
    }

    eligibleAmount = matchingItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }

  if (coupon.minimumSubtotal && eligibleAmount < coupon.minimumSubtotal) throw new Error("Order subtotal is too low for this coupon.");

  if (coupon.discountType === "percentage") {
    return Math.min(eligibleAmount, Math.round(eligibleAmount * (coupon.discountValue / 100)));
  }

  return Math.min(eligibleAmount, coupon.discountValue);
}

export function calculateTotals(
  items: OrderItemSnapshot[],
  coupon: Coupon | null,
  siteSettings: PublicSiteSettings = DEFAULT_SITE_SETTINGS,
): OrderTotals {
  const { subtotal, shipping } = calculateBaseTotals(items, siteSettings);
  const discountAmount = calculateCouponDiscount(coupon, items, subtotal);

  return {
    subtotal,
    shipping,
    discountAmount,
    totalAmount: subtotal + shipping - discountAmount,
  };
}
