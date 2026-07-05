import { Product } from "@/types/product";

export const categoryFilterOptions = [
  { label: "All Categories", value: "" },
  { label: "Abayas", value: "abayas" },
  { label: "Cord Sets", value: "cord-sets" },
  { label: "Tops", value: "tops" },
  { label: "Occasion Wear", value: "occasion-wear" },
  { label: "Dresses", value: "dresses" },
  { label: "Clearance", value: "clearance" },
];

export const colorFilterOptions = [
  { label: "All Colors", value: "" },
  { label: "Black", value: "black" },
  { label: "Pink", value: "pink" },
];

export const sizeFilterOptions = [
  { label: "All Sizes", value: "" },
  { label: "54", value: "54" },
  { label: "56", value: "56" },
  { label: "58", value: "58" },
  { label: "S", value: "S" },
  { label: "M", value: "M" },
  { label: "L", value: "L" },
];

export const availabilityFilterOptions = [
  { label: "All Availability", value: "" },
  { label: "In Stock", value: "in-stock" },
  { label: "Low Stock", value: "low-stock" },
  { label: "Out of Stock", value: "out-of-stock" },
];

export const sortFilterOptions = [
  { label: "Sort By", value: "" },
  { label: "New Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Name: A-Z", value: "name-asc" },
  { label: "Name: Z-A", value: "name-desc" },
];

export interface ProductFilterParams {
  q?: string;
  category?: string;
  color?: string;
  size?: string;
  availability?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

export interface FacetOption {
  label: string;
  value: string;
  count: number;
  swatch?: string;
}

export interface ProductFacets {
  categories: FacetOption[];
  availability: FacetOption[];
  sizes: FacetOption[];
  colors: FacetOption[];
  minPrice: number;
  maxPrice: number;
}

const colorAliases: Record<string, string[]> = {
  black: ["black", "#000000", "charcoal", "deep black"],
  pink: ["pink", "rose", "rose pink", "#ffb6c1", "#ffc0cb", "#ffd1dc", "#c8a2c8"],
};

function normalize(value: string | number | undefined | null) {
  return String(value || "").trim().toLowerCase();
}

function normalizeComparable(value: string | number | undefined | null) {
  return normalize(value).replace(/[^a-z0-9#]+/g, "");
}

function compactValues(values: Array<string | undefined | null>) {
  return values.map(normalize).filter(Boolean);
}

function getProductColorValues(product: Product) {
  return compactValues([product.colorName, product.colorHex]);
}

export function productMatchesColor(product: Product, color: string) {
  const normalizedColor = normalize(color);
  if (!normalizedColor) return true;

  const aliases = colorAliases[normalizedColor] || [normalizedColor];
  const productColors = getProductColorValues(product);

  return productColors.some((productColor) =>
    aliases.some((alias) => {
      const normalizedAlias = normalizeComparable(alias);
      const normalizedProductColor = normalizeComparable(productColor);

      return normalizedProductColor.includes(normalizedAlias) || normalizedAlias.includes(normalizedProductColor);
    }),
  );
}

function productMatchesText(product: Product, query: string) {
  const searchTerm = normalize(query);
  if (!searchTerm) return true;

  if (productMatchesColor(product, searchTerm)) {
    return true;
  }

  const searchableValues = compactValues([
    product.title,
    product.category,
    product.subCategory,
    product.description,
    product.collection,
    product.type,
    product.colorName,
  ]);

  return searchableValues.some((value) => value.includes(searchTerm));
}

function productMatchesAvailability(product: Product, availability: string) {
  const normalizedAvailability = normalize(availability);
  if (!normalizedAvailability) return true;

  const stockStatus = product.stockStatus || "in-stock";
  return stockStatus === normalizedAvailability;
}

function productMatchesSize(product: Product, size: string) {
  const normalizedSize = normalize(size);
  if (!normalizedSize) return true;
  if (product.stockStatus === "out-of-stock") return false;

  const productSizes = compactValues([
    ...(product.sizes || []),
    ...(product.subVariations?.filter((subVariation) => normalize(subVariation.size) !== "custom").map((subVariation) => subVariation.size) || []),
  ]);
  const outOfStockSizes = compactValues(product.outOfStockSizes || []);

  return productSizes.includes(normalizedSize) && !outOfStockSizes.includes(normalizedSize);
}

function productMatchesCategory(product: Product, category: string) {
  const normalizedCategory = normalize(category);
  if (!normalizedCategory) return true;
  if (normalizedCategory === "clearance") return Boolean(product.salePrice);

  return normalize(product.category) === normalizedCategory;
}

function productMatchesPrice(product: Product, minPrice: string, maxPrice: string) {
  const price = product.salePrice || product.price;
  const min = Number(minPrice);
  const max = Number(maxPrice);

  if (minPrice && Number.isFinite(min) && price < min) return false;
  if (maxPrice && Number.isFinite(max) && price > max) return false;

  return true;
}

function getCreatedAtTime(product: Product) {
  const dateTime = product.createdAt ? new Date(product.createdAt).getTime() : Number.NaN;
  if (Number.isFinite(dateTime)) return dateTime;

  const trailingNumber = Number(product._id.match(/(\d+)$/)?.[1] || 0);
  return trailingNumber;
}

export function filterProducts(products: Product[], filters: ProductFilterParams) {
  return products.filter((product) => (
    productMatchesText(product, filters.q || "") &&
    productMatchesCategory(product, filters.category || "") &&
    productMatchesColor(product, filters.color || "") &&
    productMatchesSize(product, filters.size || "") &&
    productMatchesAvailability(product, filters.availability || "") &&
    productMatchesPrice(product, filters.minPrice || "", filters.maxPrice || "")
  ));
}

export function sortProducts(products: Product[], sort: string | undefined) {
  const sortedProducts = [...products];

  sortedProducts.sort((a, b) => {
    const aPrice = a.salePrice || a.price;
    const bPrice = b.salePrice || b.price;

    switch (sort) {
      case "newest":
        return getCreatedAtTime(b) - getCreatedAtTime(a);
      case "price-asc":
        return aPrice - bPrice;
      case "price-desc":
        return bPrice - aPrice;
      case "name-asc":
        return a.title.localeCompare(b.title);
      case "name-desc":
        return b.title.localeCompare(a.title);
      default:
        return 0;
    }
  });

  return sortedProducts;
}

export function filterAndSortProducts(products: Product[], filters: ProductFilterParams) {
  return sortProducts(filterProducts(products, filters), filters.sort);
}

function addCount(map: Map<string, FacetOption>, label: string, value: string, swatch?: string) {
  const existing = map.get(value);

  if (existing) {
    existing.count += 1;
    if (!existing.swatch && swatch) existing.swatch = swatch;
    return;
  }

  map.set(value, { label, value, count: 1, swatch });
}

function colorLabelFromHex(hex: string) {
  const normalizedHex = normalize(hex);
  const labels: Record<string, string> = {
    "#000000": "Black",
    "#ffb6c1": "Pink",
    "#ffc0cb": "Pink",
    "#d2b48c": "Beige",
    "#ffdAB9": "Peach",
    "#8a9a5b": "Olive",
    "#708090": "Slate",
    "#800000": "Maroon",
    "#36454f": "Charcoal",
    "#000080": "Navy",
    "#ffffff": "White",
  };

  return labels[normalizedHex] || hex.toUpperCase();
}

function toTitleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function colorFacetValue(label: string) {
  return normalize(label);
}

function addProductColorFacets(product: Product, colorMap: Map<string, FacetOption>) {
  const seenColors = new Set<string>();
  const values = [product.colorName, product.colorHex].filter(Boolean) as string[];

  values.forEach((value) => {
    const isHex = value.trim().startsWith("#");
    const label = isHex ? colorLabelFromHex(value) : toTitleCase(value);
    const facetValue = colorFacetValue(label);

    if (!facetValue || seenColors.has(facetValue)) return;
    seenColors.add(facetValue);
    addCount(colorMap, label, facetValue, isHex ? value : undefined);
  });
}

export function getProductFacets(products: Product[]): ProductFacets {
  const categoryMap = new Map<string, FacetOption>();
  const availabilityMap = new Map<string, FacetOption>();
  const sizeMap = new Map<string, FacetOption>();
  const colorMap = new Map<string, FacetOption>();
  const prices = products.map((product) => product.salePrice || product.price).filter((price) => Number.isFinite(price));

  products.forEach((product) => {
    const category = normalize(product.category);
    const categoryLabel = categoryFilterOptions.find((option) => option.value === category)?.label || toTitleCase(category);
    if (category) addCount(categoryMap, categoryLabel, category);

    const stockStatus = product.stockStatus || "in-stock";
    const availabilityLabel = stockStatus
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    addCount(availabilityMap, availabilityLabel, stockStatus);

    const productSizes = Array.from(new Set([
      ...(product.sizes || []),
      ...(product.subVariations?.filter((subVariation) => normalize(subVariation.size) !== "custom").map((subVariation) => subVariation.size) || []),
    ])).filter((size) => !product.outOfStockSizes?.includes(size));

    productSizes.forEach((size) => addCount(sizeMap, size, size));
    addProductColorFacets(product, colorMap);
  });

  return {
    categories: Array.from(categoryMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
    availability: Array.from(availabilityMap.values()),
    sizes: Array.from(sizeMap.values()).sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    colors: Array.from(colorMap.values()).sort((a, b) => a.label.localeCompare(b.label)),
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
  };
}

export function hasActiveProductFilters(filters: ProductFilterParams) {
  return Boolean(
    filters.q ||
    filters.category ||
    filters.color ||
    filters.size ||
    filters.availability ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.sort,
  );
}
