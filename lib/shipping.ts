import { PublicSiteSettings } from "@/types/siteSettings";

export const DEFAULT_SITE_SETTINGS: PublicSiteSettings = {
  customSizeCharge: 1500,
  customSizeDispatchDays: 14,
  bankTransferDeadlineDays: 3,
  shippingBaseFee: 1500,
  shippingProductWeightGrams: 700,
  shippingExtraFeePerKg: 100,
  shippingRoundingGraceGrams: 100,
};

export interface ShippingQuote {
  totalWeightGrams: number;
  billableKg: number;
  extraKg: number;
  shipping: number;
}

export function normalizeSiteSettings(settings?: Partial<PublicSiteSettings> | null): PublicSiteSettings {
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...Object.fromEntries(
      Object.entries(settings || {}).filter(([, value]) => value !== undefined && value !== null),
    ),
  };
}

export function calculateShippingQuote(quantity: number, settings?: Partial<PublicSiteSettings> | null): ShippingQuote {
  const normalizedSettings = normalizeSiteSettings(settings);
  const safeQuantity = Math.max(0, Math.floor(quantity));

  if (safeQuantity === 0) {
    return {
      totalWeightGrams: 0,
      billableKg: 0,
      extraKg: 0,
      shipping: 0,
    };
  }

  const totalWeightGrams = safeQuantity * normalizedSettings.shippingProductWeightGrams;
  const billableKg = Math.max(
    1,
    Math.ceil((totalWeightGrams - normalizedSettings.shippingRoundingGraceGrams) / 1000),
  );
  const extraKg = Math.max(0, billableKg - 1);

  return {
    totalWeightGrams,
    billableKg,
    extraKg,
    shipping: normalizedSettings.shippingBaseFee + extraKg * normalizedSettings.shippingExtraFeePerKg,
  };
}

