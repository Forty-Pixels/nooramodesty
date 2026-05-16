import { createClient } from "@sanity/client";

const categoryStructure = [
  {
    title: "Abayas",
    slug: "abayas",
    subCategories: [
      { title: "Embroidered", slug: "embroidered" },
      { title: "Coat", slug: "coat" },
      { title: "Wedding", slug: "wedding" },
    ],
  },
  {
    title: "Cord Sets",
    slug: "cord-sets",
    subCategories: [
      { title: "Embroidered", slug: "embroidered" },
      { title: "Long", slug: "long" },
      { title: "One Piece", slug: "one-piece" },
      { title: "Printed", slug: "printed" },
    ],
  },
  {
    title: "Tops",
    slug: "tops",
    subCategories: [
      { title: "Embroidered", slug: "embroidered" },
      { title: "Plain", slug: "plain" },
      { title: "Printed", slug: "printed" },
    ],
  },
  {
    title: "Dresses",
    slug: "dresses",
    subCategories: [
      { title: "Maxi", slug: "maxi" },
      { title: "Satin", slug: "satin" },
      { title: "Printed", slug: "printed" },
      { title: "Wrap", slug: "wrap" },
    ],
  },
  {
    title: "Occasion Wear",
    slug: "occasion-wear",
    subCategories: [
      { title: "Abayas", slug: "abayas" },
      { title: "Overcoats", slug: "overcoats" },
      { title: "Tops", slug: "tops" },
      { title: "Sets", slug: "sets" },
    ],
  },
];

const requiredEnv = ["NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET", "SANITY_API_TOKEN"];
const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing env: ${missing.join(", ")}`);
  process.exit(1);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-03-01",
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
});

for (const [index, category] of categoryStructure.entries()) {
  await client.createOrReplace({
    _id: `category.${category.slug}`,
    _type: "category",
    title: category.title,
    slug: { _type: "slug", current: category.slug },
    isActive: true,
    showInNavigation: true,
    showOnHomepage: true,
    sortOrder: index,
    subCategories: category.subCategories.map((subCategory) => ({
      _type: "reference",
      _key: subCategory.slug,
      _ref: `subcategory.${category.slug}.${subCategory.slug}`,
    })),
  });

  for (const [subIndex, subCategory] of category.subCategories.entries()) {
    await client.createOrReplace({
      _id: `subcategory.${category.slug}.${subCategory.slug}`,
      _type: "subCategory",
      title: subCategory.title,
      slug: { _type: "slug", current: subCategory.slug },
      category: {
        _type: "reference",
        _ref: `category.${category.slug}`,
      },
      isActive: true,
      sortOrder: subIndex,
    });
  }
}

console.log(`Seeded ${categoryStructure.length} categories with subcategories`);
