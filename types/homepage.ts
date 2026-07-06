import { Product } from "@/types/product";

export interface HeroContent {
  layout: "split" | "splitFlipped" | "fullSingleImage" | "fullTwoImage";
  imageOneSrc: string;
  imageTwoSrc: string;
  centerLogoSrc: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface InNooraImage {
  _id: string;
  url: string;
  alt: string;
  productSlug?: string;
  customerName?: string;
}

export interface HomepageProductSection {
  _key: string;
  title: string;
  categorySlug?: string;
  products: Product[];
}

export interface HomepageContent {
  hero: HeroContent;
  productSections: HomepageProductSection[];
  inNooraImages: InNooraImage[];
}
