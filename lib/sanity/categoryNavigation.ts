import "server-only";

import { createClient } from "next-sanity";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "@/lib/sanity/env";
import { CategoryNavigationItem, CategoryNavigationSubCategory } from "@/types/categoryNavigation";

interface RawCategory {
  _id: string;
  title?: string;
  slug?: { current?: string };
}

interface RawSubCategory {
  _id: string;
  title?: string;
  slug?: { current?: string };
  isActive?: boolean | null;
  sortOrder?: number | null;
  category?: {
    _ref?: string;
  } | null;
}

const sanityReadClient = sanityProjectId && sanityDataset && process.env.SANITY_API_TOKEN
  ? createClient({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      apiVersion: sanityApiVersion,
      token: process.env.SANITY_API_TOKEN,
      useCdn: false,
    })
  : null;

export const fallbackCategoryNavigation: CategoryNavigationItem[] = [
  {
    _id: "category.abayas",
    title: "Abayas",
    slug: "abayas",
    subCategories: [
      { _id: "subcategory.abayas.embroidered", title: "Embroidered", slug: "embroidered" },
      { _id: "subcategory.abayas.coat", title: "Coat", slug: "coat" },
      { _id: "subcategory.abayas.piping", title: "Piping", slug: "piping" },
    ],
  },
  {
    _id: "category.cord-sets",
    title: "Cord Sets",
    slug: "cord-sets",
    subCategories: [
      { _id: "subcategory.cord-sets.embroidered", title: "Embroidered", slug: "embroidered" },
      { _id: "subcategory.cord-sets.long", title: "Long", slug: "long" },
      { _id: "subcategory.cord-sets.one-piece", title: "One Piece", slug: "one-piece" },
      { _id: "subcategory.cord-sets.printed", title: "Printed", slug: "printed" },
    ],
  },
  {
    _id: "category.tops",
    title: "Tops",
    slug: "tops",
    subCategories: [
      { _id: "subcategory.tops.embroidered", title: "Embroidered", slug: "embroidered" },
      { _id: "subcategory.tops.plain", title: "Plain", slug: "plain" },
      { _id: "subcategory.tops.printed", title: "Printed", slug: "printed" },
    ],
  },
  {
    _id: "category.occasion-wear",
    title: "Occasion Wear",
    slug: "occasion-wear",
    subCategories: [
      { _id: "subcategory.occasion-wear.abayas", title: "Abayas", slug: "abayas" },
      { _id: "subcategory.occasion-wear.overcoats", title: "Overcoats", slug: "overcoats" },
      { _id: "subcategory.occasion-wear.tops", title: "Tops", slug: "tops" },
      { _id: "subcategory.occasion-wear.sets", title: "Sets", slug: "sets" },
    ],
  },
];

const CATEGORIES_QUERY = `*[
  _type == "category" &&
  isActive != false &&
  showInNavigation != false
] | order(sortOrder asc, title asc) {
  _id,
  title,
  slug
}`;

const SUB_CATEGORIES_QUERY = `*[
  _type == "subCategory" &&
  isActive != false
] | order(category->sortOrder asc, sortOrder asc, title asc) {
  _id,
  title,
  slug,
  isActive,
  sortOrder,
  category
}`;

function slugValue(value: { current?: string } | undefined | null) {
  return value?.current || "";
}

function toSubCategory(raw: RawSubCategory): CategoryNavigationSubCategory | null {
  const title = raw.title;
  const slug = slugValue(raw.slug);

  if (!title || !slug || raw.isActive === false) return null;

  return {
    _id: raw._id,
    title,
    slug,
    sortOrder: raw.sortOrder ?? undefined,
  };
}

export async function getCategoryNavigation(): Promise<CategoryNavigationItem[]> {
  if (!sanityReadClient) {
    return fallbackCategoryNavigation;
  }

  const [rawCategories, rawSubCategories] = await Promise.all([
    sanityReadClient.fetch<RawCategory[]>(CATEGORIES_QUERY, {}, { next: { revalidate: 60, tags: ["category"] } }),
    sanityReadClient.fetch<RawSubCategory[]>(SUB_CATEGORIES_QUERY, {}, { next: { revalidate: 60, tags: ["category"] } }),
  ]);

  const subCategoriesByParent = new Map<string, CategoryNavigationSubCategory[]>();

  rawSubCategories.forEach((rawSubCategory) => {
    const parentId = rawSubCategory.category?._ref;
    if (!parentId) return;

    const subCategory = toSubCategory(rawSubCategory);
    if (!subCategory) return;

    const siblings = subCategoriesByParent.get(parentId) || [];
    siblings.push(subCategory);
    subCategoriesByParent.set(parentId, siblings);
  });

  const navigation = rawCategories
    .map((category) => {
      const slug = slugValue(category.slug);
      if (!category.title || !slug) return null;

      return {
        _id: category._id,
        title: category.title,
        slug,
        subCategories: subCategoriesByParent.get(category._id) || [],
      };
    })
    .filter((category): category is CategoryNavigationItem => Boolean(category));

  return navigation.length > 0 ? navigation : fallbackCategoryNavigation;
}
