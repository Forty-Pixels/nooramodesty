import { defineField, defineType } from "sanity";

export const category = defineType({
  name: "category",
  title: "Category",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
    defineField({
      name: "subCategories",
      title: "Sub categories",
      type: "array",
      of: [{ type: "reference", to: [{ type: "subCategory" }] }],
      description: "Use only the subcategories defined for this category in the project spec.",
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "showInNavigation",
      title: "Show in navigation",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "showOnHomepage",
      title: "Available for homepage sections",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: {
      title: "title",
      subtitle: "slug.current",
    },
  },
});
