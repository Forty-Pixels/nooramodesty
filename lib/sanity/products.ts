import { Product } from "@/types/product";
import { sanityClient } from "./client";
import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCTS_BY_CATEGORY_QUERY,
  RELATED_PRODUCTS_QUERY,
  SALE_PRODUCTS_QUERY,
} from "./queries";

interface SanityProductResult extends Product {
  categoryRef?: string | null;
  subCategoryRef?: string | null;
}

function slugFromReference(reference: string | null | undefined, prefix: string): string | undefined {
  if (!reference?.startsWith(prefix)) {
    return undefined;
  }

  const slugPath = reference.slice(prefix.length);
  return slugPath.split(".").at(-1);
}

function normalizeProduct(product: SanityProductResult): Product {
  const { categoryRef, subCategoryRef, ...normalizedProduct } = product;

  return {
    ...normalizedProduct,
    category: normalizedProduct.category || slugFromReference(categoryRef, "category.") || "",
    subCategory: normalizedProduct.subCategory || slugFromReference(subCategoryRef, "subcategory."),
  };
}

function normalizeProducts(products: SanityProductResult[]): Product[] {
  return products.map(normalizeProduct);
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!sanityClient) {
    return [];
  }

  const query = category === "sale" ? SALE_PRODUCTS_QUERY : PRODUCTS_BY_CATEGORY_QUERY;
  const params = category === "sale" ? {} : { category, categoryRef: `category.${category}` };

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

  const products = await sanityClient.fetch<SanityProductResult[]>(
    RELATED_PRODUCTS_QUERY,
    { category: product.category, categoryRef: `category.${product.category}`, slug: product.slug },
    { next: { revalidate: 60, tags: ["product"] } },
  );

  return normalizeProducts(products);
}
