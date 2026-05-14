import { blockContent } from "./blockContent";
import { category } from "./category";
import { homepage, homepageProductSection, inNooraImage } from "./homepage";
import { materialSpecs } from "./materialSpecs";
import { product } from "./product";
import { siteSettings } from "./siteSettings";
import { subCategory } from "./subCategory";
import { subVariation, variation } from "./variation";

export const schemaTypes = [
  blockContent,
  subCategory,
  category,
  materialSpecs,
  subVariation,
  variation,
  product,
  homepageProductSection,
  inNooraImage,
  homepage,
  siteSettings,
];
