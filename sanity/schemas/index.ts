import { blockContent } from "./blockContent";
import { category } from "./category";
import { coupon } from "./coupon";
import { homepage, homepageProductSection, inNooraImage } from "./homepage";
import { leadSubmission, leadSubmissionAttachment } from "./leadSubmission";
import { materialSpecs } from "./materialSpecs";
import { order, orderItem } from "./order";
import { product } from "./product";
import { returnExchangeRequest } from "./returnExchangeRequest";
import { shippingReturnPolicy, shippingReturnPolicySection } from "./shippingReturnPolicy";
import { siteSettings } from "./siteSettings";
import { subCategory } from "./subCategory";
import { subVariation } from "./variation";

export const schemaTypes = [
  blockContent,
  subCategory,
  category,
  materialSpecs,
  subVariation,
  product,
  orderItem,
  order,
  returnExchangeRequest,
  leadSubmissionAttachment,
  leadSubmission,
  coupon,
  homepageProductSection,
  inNooraImage,
  homepage,
  siteSettings,
  shippingReturnPolicySection,
  shippingReturnPolicy,
];
