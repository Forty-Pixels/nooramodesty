import { blockContent } from "./blockContent";
import { category } from "./category";
import { coupon } from "./coupon";
import { homepage, homepageProductSection, inNooraImage } from "./homepage";
import { materialSpecs } from "./materialSpecs";
import { order, orderItem } from "./order";
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
  orderItem,
  order,
  coupon,
  homepageProductSection,
  inNooraImage,
  homepage,
  siteSettings,
];
