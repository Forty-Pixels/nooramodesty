import { abayas, cordSets, tops } from "@/data/products";
import { inNooraImages as fallbackInNooraImages } from "@/data/inNoora";
import { HomepageContent } from "@/types/homepage";
import { sanityClient } from "./client";
import { HOMEPAGE_QUERY } from "./queries";

const fallbackHomepageContent: HomepageContent = {
  hero: {
    imageOneSrc: "/landing-page/hero/hero-image1.png",
    imageTwoSrc: "/landing-page/hero/hero-image-2.png",
    centerLogoSrc: "/noora-modesty-logo-2.png",
    ctaLabel: "SHOP ALL",
    ctaHref: "/category/abayas",
  },
  productSections: [
    { _key: "abayas", title: "ABAYAS", categorySlug: "abayas", products: abayas.slice(0, 8) },
    { _key: "cord-sets", title: "CORD SETS", categorySlug: "cord-sets", products: cordSets.slice(0, 8) },
    {
      _key: "occasion-wear",
      title: "OCCASION WEAR",
      categorySlug: "occasion-wear",
      products: [...abayas.slice(0, 4), ...cordSets.slice(0, 4)],
    },
    { _key: "tops", title: "TOPS", categorySlug: "tops", products: tops.slice(0, 8) },
  ],
  inNooraImages: fallbackInNooraImages,
};

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0) || "";
}

export async function getHomepageContent(): Promise<HomepageContent> {
  if (!sanityClient) {
    return fallbackHomepageContent;
  }

  const data = await sanityClient.fetch<Partial<HomepageContent> | null>(
    HOMEPAGE_QUERY,
    {},
    { next: { revalidate: 60, tags: ["homepage", "product"] } },
  );

  if (!data) {
    return fallbackHomepageContent;
  }

  const productSections = data.productSections
    ?.map((section) => ({
      ...section,
      products: section.products.filter((product) => product.mainImage && product.slug),
    }))
    .filter((section) => section.products.length > 0);

  const inNooraImages = data.inNooraImages?.filter((image) => image.url && image.alt);

  return {
    hero: {
      imageOneSrc: firstNonEmpty(data.hero?.imageOneSrc, fallbackHomepageContent.hero.imageOneSrc),
      imageTwoSrc: firstNonEmpty(data.hero?.imageTwoSrc, fallbackHomepageContent.hero.imageTwoSrc),
      centerLogoSrc: firstNonEmpty(data.hero?.centerLogoSrc, fallbackHomepageContent.hero.centerLogoSrc),
      ctaLabel: firstNonEmpty(data.hero?.ctaLabel, fallbackHomepageContent.hero.ctaLabel),
      ctaHref: firstNonEmpty(data.hero?.ctaHref, fallbackHomepageContent.hero.ctaHref),
    },
    productSections:
      productSections && productSections.length > 0
        ? productSections
        : fallbackHomepageContent.productSections,
    inNooraImages:
      inNooraImages && inNooraImages.length > 0
        ? inNooraImages
        : fallbackHomepageContent.inNooraImages,
  };
}
