export const categoryStructure = [
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
] as const;

export const productSubCategoryOptions = categoryStructure.flatMap((category) =>
  category.subCategories.map((subCategory) => ({
    title: `${category.title} / ${subCategory.title}`,
    value: `${category.slug}:${subCategory.slug}`,
  })),
);

export const legacySubCategoryOptions = Array.from(
  new Map(
    categoryStructure.flatMap((category) =>
      category.subCategories.map((subCategory) => [
        subCategory.slug,
        { title: subCategory.title, value: subCategory.slug },
      ]),
    ),
  ).values(),
);
