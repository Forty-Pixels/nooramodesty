import "server-only";

import { sanityClient } from "@/lib/sanity/client";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings } from "@/lib/shipping";
import { PublicSiteSettings } from "@/types/siteSettings";

const siteSettingsQuery = `*[_type == "siteSettings"][0]{
  whatsappNumber,
  announcementEnabled,
  announcementText,
  announcementHref,
  bankName,
  bankAccountName,
  bankAccountNumber,
  bankBranch,
  customSizeCharge,
  customSizeDispatchDays,
  bankTransferDeadlineDays,
  shippingBaseFee,
  shippingProductWeightGrams,
  shippingExtraFeePerKg,
  shippingRoundingGraceGrams
}`;

export async function fetchPublicSiteSettings(): Promise<PublicSiteSettings> {
  if (!sanityClient) {
    return DEFAULT_SITE_SETTINGS;
  }

  const settings = await sanityClient.fetch<Partial<PublicSiteSettings> | null>(
    siteSettingsQuery,
    {},
    { next: { revalidate: 60 } },
  );

  return normalizeSiteSettings(settings);
}
