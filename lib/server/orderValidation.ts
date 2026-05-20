import "server-only";

import { z } from "zod";
import { sanityClient } from "@/lib/sanity/client";
import {
  CheckoutOrderPayload,
  Coupon,
  OrderItemInput,
  OrderItemSnapshot,
  OrderTotals,
} from "@/types/order";

const CUSTOM_SIZE_CHARGE = 850;
const FREE_SHIPPING_THRESHOLD = 50000;
const STANDARD_SHIPPING = 1500;

export const checkoutOrderSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2),
    mobile: z.string().trim().min(6),
    email: z.string().trim().email(),
    addressLine1: z.string().trim().min(3),
    addressLine2: z.string().trim().optional(),
    city: z.string().trim().min(2),
    zipCode: z.string().trim().min(2),
  }),
  items: z.array(
    z.object({
      productId: z.string().trim().min(1),
      clickomVariationId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().min(1).max(20),
      selectedColor: z.string().trim().optional(),
      selectedSize: z.string().trim().optional(),
      customSize: z.boolean().default(false),
      customNote: z.string().trim().optional(),
    }),
  ).min(1),
  paymentMethod: z.enum(["cod", "bank_transfer"]),
  couponCode: z.string().trim().optional(),
});

interface ProductForOrder {
  _id: string;
  title: string;
  slug: string;
  mainImage?: string;
  price: number;
  salePrice?: number;
  isVisible?: boolean;
  clickomProductId?: number;
  variations?: Array<{
    name: string;
    colorHex?: string;
    subVariations?: Array<{
      size: string;
      clickomVariationId?: number;
    }>;
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
      variations[]{
        name,
        colorHex,
        subVariations[]{
          size,
          clickomVariationId
        }
      }
    }`,
    { ids: productIds },
    { next: { revalidate: 0 } },
  );
}

function validateItem(input: OrderItemInput, product: ProductForOrder): OrderItemSnapshot {
  if (product.isVisible === false) {
    throw new Error(`${product.title} is not available.`);
  }

  const matchingSubVariation = product.variations
    ?.flatMap((variation) => variation.subVariations || [])
    .find((subVariation) => subVariation.clickomVariationId === input.clickomVariationId);

  if (product.variations?.length && !matchingSubVariation) {
    throw new Error(`${product.title} has an invalid size selection.`);
  }

  const unitPrice = product.salePrice || product.price;
  const customCharge = input.customSize ? CUSTOM_SIZE_CHARGE : 0;

  return {
    ...input,
    title: product.title,
    slug: product.slug,
    image: product.mainImage,
    selectedSize: input.selectedSize || matchingSubVariation?.size,
    clickomProductId: product.clickomProductId || 1,
    unitPrice: unitPrice + customCharge,
  };
}

export async function buildOrderItems(items: OrderItemInput[]): Promise<OrderItemSnapshot[]> {
  const productIds = Array.from(new Set(items.map((item) => item.productId)));
  const products = await fetchProducts(productIds);
  const productById = new Map(products.map((product) => [product._id, product]));

  return items.map((item) => {
    const product = productById.get(item.productId);

    if (!product) {
      throw new Error("One or more products are no longer available.");
    }

    return validateItem(item, product);
  });
}

export function calculateBaseTotals(items: OrderItemSnapshot[]): Omit<OrderTotals, "discountAmount" | "totalAmount"> {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

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
      minimumSubtotal
    }`,
    { code: normalizedCode },
    { next: { revalidate: 0 } },
  );
}

export function calculateCouponDiscount(coupon: Coupon | null, subtotal: number): number {
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
  if (coupon.minimumSubtotal && subtotal < coupon.minimumSubtotal) throw new Error("Order subtotal is too low for this coupon.");

  if (coupon.discountType === "percentage") {
    return Math.min(subtotal, Math.round(subtotal * (coupon.discountValue / 100)));
  }

  return Math.min(subtotal, coupon.discountValue);
}

export function calculateTotals(
  items: OrderItemSnapshot[],
  coupon: Coupon | null,
): OrderTotals {
  const { subtotal, shipping } = calculateBaseTotals(items);
  const discountAmount = calculateCouponDiscount(coupon, subtotal);

  return {
    subtotal,
    shipping,
    discountAmount,
    totalAmount: subtotal + shipping - discountAmount,
  };
}
