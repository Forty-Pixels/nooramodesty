import { abayas, cordSets, dresses, occasionWear, products, saleProducts, tops } from "@/data/products";
import { Product } from "@/types/product";
import { sanityClient } from "./client";
import {
  PRODUCT_BY_SLUG_QUERY,
  PRODUCTS_BY_CATEGORY_QUERY,
  RELATED_PRODUCTS_QUERY,
  SALE_PRODUCTS_QUERY,
} from "./queries";

const fallbackProductsByCategory: Record<string, Product[]> = {
  abayas,
  "cord-sets": cordSets,
  tops,
  "occasion-wear": occasionWear,
  dresses,
  sale: saleProducts,
};

export async function getProductsByCategory(category: string): Promise<Product[]> {
  if (!sanityClient) {
    return fallbackProductsByCategory[category] || abayas;
  }

  const query = category === "sale" ? SALE_PRODUCTS_QUERY : PRODUCTS_BY_CATEGORY_QUERY;
  const params = category === "sale" ? {} : { category };

  const data = await sanityClient.fetch<Product[]>(
    query,
    params,
    { next: { revalidate: 60, tags: ["product"] } },
  );

  return data.length > 0 ? data : fallbackProductsByCategory[category] || [];
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!sanityClient) {
    return products.find((product) => product.slug === slug) || null;
  }

  return sanityClient.fetch<Product | null>(
    PRODUCT_BY_SLUG_QUERY,
    { slug },
    { next: { revalidate: 60, tags: ["product"] } },
  );
}

export async function getRelatedProducts(product: Product): Promise<Product[]> {
  if (!sanityClient) {
    return products
      .filter((relatedProduct) => relatedProduct.category === product.category && relatedProduct._id !== product._id)
      .slice(0, 4);
  }

  const data = await sanityClient.fetch<Product[]>(
    RELATED_PRODUCTS_QUERY,
    { category: product.category, slug: product.slug },
    { next: { revalidate: 60, tags: ["product"] } },
  );

  return data.length > 0
    ? data
    : products
        .filter((relatedProduct) => relatedProduct.category === product.category && relatedProduct._id !== product._id)
        .slice(0, 4);
}
