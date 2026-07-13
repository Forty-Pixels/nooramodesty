import { defineQuery } from "next-sanity";

const productProjection = `
  _id,
  "createdAt": _createdAt,
  title,
  "slug": slug.current,
  "mainImage": mainImage.asset->url,
  "images": coalesce(images[].asset->url, [mainImage.asset->url]),
  "sizeGuideImage": sizeGuideImage.asset->url,
  price,
  salePrice,
  plainDescription,
  "description": plainDescription,
  "category": coalesce(category->slug.current, category.slug.current, category.slug),
  "subCategory": coalesce(subCategory->slug.current, subCategory.slug.current, subCategory.slug),
  "subCategoryParent": coalesce(subCategory->category->slug.current, subCategory.category->slug.current, subCategory.category.slug.current, subCategory.category.slug),
  type,
  colorName,
  colorHex,
  collection,
  styleGroup,
  "sizes": array::unique(subVariations[size != "Custom"].size),
  enablePreOrders,
  enableCustomSizes,
  isNewArrival,
  showLowStock,
  manualStockCount,
  isVisible,
  clickomProductId,
  subVariations[]{
    size,
    clickomVariationId,
    sku
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
    layout,
    "imageOneSrc": leftImage.asset->url,
    "imageTwoSrc": rightImage.asset->url,
    "centerLogoSrc": centerLogo.asset->url,
    ctaLabel,
    ctaHref,
    slides[]{
      "imageSrc": image.asset->url,
      alt
    }
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

export const ALL_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false
] | order(title asc) {
  ${productProjection}
}`);

export const PRODUCTS_BY_CATEGORY_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false &&
  (
    coalesce(category->slug.current, category.slug.current, category.slug) == $category ||
    category._ref == $categoryRef ||
    subCategory->category->slug.current == $category ||
    subCategory->category._ref == $categoryRef
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

export const RELATED_PRODUCTS_BY_STYLE_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false &&
  defined(styleGroup) &&
  styleGroup == $styleGroup &&
  slug.current != $slug
] | order(title asc)[0...8] {
  ${productProjection}
}`);

export const RELATED_PRODUCTS_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false &&
  (
    coalesce(category->slug.current, category.slug.current, category.slug) == $category ||
    category._ref == $categoryRef ||
    subCategory->category->slug.current == $category ||
    subCategory->category._ref == $categoryRef
  ) &&
  !(slug.current in $excludeSlugs)
] | order(title asc)[0...8] {
  ${productProjection}
}`);

export const ACCESSORIES_FOR_CATEGORY_QUERY = defineQuery(`*[
  _type == "product" &&
  isVisible != false &&
  lower(coalesce(subCategory->slug.current, subCategory.slug.current, subCategory.slug, "")) match "*accessories*" &&
  (
    coalesce(category->slug.current, category.slug.current, category.slug) == $category ||
    category._ref == $categoryRef ||
    subCategory->category->slug.current == $category ||
    subCategory->category._ref == $categoryRef
  ) &&
  !(slug.current in $excludeSlugs)
] | order(title asc)[0...6] {
  ${productProjection}
}`);
