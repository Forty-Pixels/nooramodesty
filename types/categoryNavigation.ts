export interface CategoryNavigationSubCategory {
  _id: string;
  title: string;
  slug: string;
  sortOrder?: number;
}

export interface CategoryNavigationItem {
  _id: string;
  title: string;
  slug: string;
  subCategories: CategoryNavigationSubCategory[];
}
