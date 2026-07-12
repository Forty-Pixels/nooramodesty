import { Product } from "@/types/product";

export interface HeroSlide {
  imageSrc: string;
  alt?: string;
}

export interface HeroContent {
  layout: "split" | "splitFlipped" | "fullSingleImage" | "fullTwoImage" | "carousel";
  imageOneSrc: string;
  imageTwoSrc: string;
  centerLogoSrc: string;
  ctaLabel: string;
  ctaHref: string;
  slides: HeroSlide[];
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
