import { Product } from "@/types/product";
import { sanityClient } from "./client";
import {
  ACCESSORIES_FOR_CATEGORY_QUERY,
  ALL_PRODUCTS_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  PRODUCTS_BY_CATEGORY_QUERY,
  RELATED_PRODUCTS_BY_STYLE_QUERY,
  RELATED_PRODUCTS_QUERY,
  SALE_PRODUCTS_QUERY,
} from "./queries";

const RELATED_PRODUCTS_LIMIT = 4;

interface SanityProductResult extends Product {
  categoryRef?: string | null;
  subCategoryRef?: string | null;
  subCategoryParent?: string | null;
  subCategoryParentRef?: string | null;
}

function slugFromReference(reference: string | null | undefined, prefix: string): string | undefined {
  if (!reference?.startsWith(prefix)) {
    return undefined;
  }

  const slugPath = reference.slice(prefix.length);
  return slugPath.split(".").at(-1);
}

function normalizeProduct(product: SanityProductResult): Product {
  const {
    categoryRef,
    subCategoryRef,
    subCategoryParent,
    subCategoryParentRef,
    ...normalizedProduct
  } = product;

  return {
    ...normalizedProduct,
    category:
      normalizedProduct.category ||
      slugFromReference(categoryRef, "category.") ||
      subCategoryParent ||
      slugFromReference(subCategoryParentRef, "category.") ||
      "",
    subCategory: normalizedProduct.subCategory || slugFromReference(subCategoryRef, "subcategory."),
  };
}

function normalizeProducts(products: SanityProductResult[]): Product[] {
  return products.map(normalizeProduct);
}

export async function getAllProducts(): Promise<Product[]> {
  if (!sanityClient) {
    return [];
  }

  const products = await sanityClient.fetch<SanityProductResult[]>(
    ALL_PRODUCTS_QUERY,
    {},
    { next: { revalidate: 60, tags: ["product"] } },
  );

  return normalizeProducts(products);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!sanityClient) {
    return [];
  }

  const query = category === "clearance" ? SALE_PRODUCTS_QUERY : PRODUCTS_BY_CATEGORY_QUERY;
  const params = category === "clearance" ? {} : { category, categoryRef: `category.${category}` };

  const products = await sanityClient.fetch<SanityProductResult[]>(
    query,
    params,
    { next: { revalidate: 60, tags: ["product"] } },
  );

  return normalizeProducts(products);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!sanityClient) {
    return null;
  }

  const product = await sanityClient.fetch<SanityProductResult | null>(
    PRODUCT_BY_SLUG_QUERY,
    { slug },
    { next: { revalidate: 60, tags: ["product"] } },
  );

  return product ? normalizeProduct(product) : null;
}

export async function getRelatedProducts(product: Product): Promise<Product[]> {
  if (!sanityClient) {
    return [];
  }

  const styleMatches = product.styleGroup
    ? await sanityClient.fetch<SanityProductResult[]>(
        RELATED_PRODUCTS_BY_STYLE_QUERY,
        { styleGroup: product.styleGroup, slug: product.slug },
        { next: { revalidate: 60, tags: ["product"] } },
      )
    : [];

  if (styleMatches.length >= RELATED_PRODUCTS_LIMIT) {
    return normalizeProducts(styleMatches.slice(0, RELATED_PRODUCTS_LIMIT));
  }

  const excludeSlugs = [product.slug, ...styleMatches.map((item) => item.slug)];
  const categoryMatches = await sanityClient.fetch<SanityProductResult[]>(
    RELATED_PRODUCTS_QUERY,
    { category: product.category, categoryRef: `category.${product.category}`, excludeSlugs },
    { next: { revalidate: 60, tags: ["product"] } },
  );

  return normalizeProducts([...styleMatches, ...categoryMatches].slice(0, RELATED_PRODUCTS_LIMIT));
}

export async function getCompleteTheLookProducts(product: Product): Promise<Product[]> {
  if (!sanityClient) {
    return [];
  }

  const accessories = await sanityClient.fetch<SanityProductResult[]>(
    ACCESSORIES_FOR_CATEGORY_QUERY,
    { category: product.category, categoryRef: `category.${product.category}`, excludeSlugs: [product.slug] },
    { next: { revalidate: 60, tags: ["product"] } },
  );

  return normalizeProducts(accessories);
}
