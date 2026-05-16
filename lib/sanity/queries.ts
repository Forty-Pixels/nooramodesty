import { defineQuery } from "next-sanity";

const productProjection = `
  _id,
  title,
  "slug": slug.current,
  "mainImage": mainImage.asset->url,
  "images": coalesce(images[].asset->url, [mainImage.asset->url]),
  price,
  salePrice,
  plainDescription,
  "description": plainDescription,
  "category": category->slug.current,
  "categoryRef": category._ref,
  "subCategory": subCategory->slug.current,
  "subCategoryRef": subCategory._ref,
  type,
  color,
  collection,
  "colors": variations[].colorHex,
  "sizes": array::unique(variations[].subVariations[].size),
  enablePreOrders,
  enableCustomSizes,
  isVisible,
  clickomProductId,
  variations[]{
    name,
    colorHex,
    clickomVariationId,
    subVariations[]{
      size,
      clickomVariationId,
      sku
    }
  },
  materialSpecs{
    gsm,
    composition,
    properties,
    "macroImage": macroImage.asset->url
  }
`;

export const HOMEPAGE_QUERY = defineQuery(`*[_type == "homepage"][0]{
  hero{
    "imageOneSrc": leftImage.asset->url,
    "imageTwoSrc": rightImage.asset->url,
    "centerLogoSrc": centerLogo.asset->url,
    ctaLabel,
    ctaHref
  },
  productSections[isVisible != false][0...4]{
    _key,
    title,
    "categorySlug": category->slug.current,
    products[0...8]->{
      ${productProjection}
    }
  },
  inNooraImages[]{
    "_id": coalesce(_key, image.asset->_id),
    "url": image.asset->url,
    alt,
    "productSlug": linkedProduct->slug.current,
    customerName
  }
}`);

export const PRODUCTS_BY_CATEGORY_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false &&
  (
    category->slug.current == $category ||
    category._ref == $categoryRef
  )
] | order(title asc) {
  ${productProjection}
}`);

export const SALE_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false &&
  defined(salePrice)
] | order(title asc) {
  ${productProjection}
}`);

export const PRODUCT_BY_SLUG_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false &&
  slug.current == $slug
][0] {
  ${productProjection}
}`);

export const RELATED_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false &&
  (
    category->slug.current == $category ||
    category._ref == $categoryRef
  ) &&
  slug.current != $slug
] | order(title asc)[0...4] {
  ${productProjection}
}`);
