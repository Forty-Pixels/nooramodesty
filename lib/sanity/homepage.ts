import { HomepageContent } from "@/types/homepage";
import { sanityClient } from "./client";
import { HOMEPAGE_QUERY } from "./queries";

const emptyHomepageContent: HomepageContent = {
  hero: {
    layout: "split",
    imageOneSrc: "",
    imageTwoSrc: "",
    centerLogoSrc: "",
    ctaLabel: "",
    ctaHref: "",
    slides: [],
  },
  productSections: [],
  inNooraImages: [],
};

function firstNonEmpty(...values: Array<string | null | undefined>) {
  return values.find((value) => typeof value === "string" && value.trim().length > 0) || "";
}

function normalizeHeroLayout(layout: string | undefined): HomepageContent["hero"]["layout"] {
  if (layout === "splitFlipped" || layout === "fullSingleImage" || layout === "fullTwoImage" || layout === "carousel") {
    return layout;
  }

  if (layout === "fullLeftImage" || layout === "fullRightImage") {
    return "fullSingleImage";
  }

  return "split";
}

export async function getHomepageContent(): Promise<HomepageContent> {
  if (!sanityClient) {
    return emptyHomepageContent;
  }

  const data = await sanityClient.fetch<Partial<HomepageContent> | null>(
    HOMEPAGE_QUERY,
    {},
    { next: { revalidate: 60, tags: ["homepage", "product"] } },
  );

  if (!data) {
    return emptyHomepageContent;
  }

  const productSections = data.productSections
    ?.map((section) => ({
      ...section,
      products: section.products.filter((product) => product?.mainImage && product?.slug && product?.isVisible !== false),
    }))
    .filter((section) => section.products.length > 0);

  const inNooraImages = data.inNooraImages?.filter((image) => image.url && image.alt);

  return {
    hero: {
      layout: normalizeHeroLayout(data.hero?.layout),
      imageOneSrc: firstNonEmpty(data.hero?.imageOneSrc),
      imageTwoSrc: firstNonEmpty(data.hero?.imageTwoSrc),
      centerLogoSrc: firstNonEmpty(data.hero?.centerLogoSrc),
      ctaLabel: firstNonEmpty(data.hero?.ctaLabel),
      ctaHref: firstNonEmpty(data.hero?.ctaHref),
      slides: data.hero?.slides?.filter((slide) => slide?.imageSrc) || [],
    },
    productSections: productSections || [],
    inNooraImages: inNooraImages || [],
  };
}
