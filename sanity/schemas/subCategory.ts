import { defineField, defineType } from "sanity";

export const subCategory = defineType({
  name: "subCategory",
  title: "Sub category",
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
      name: "category",
      title: "Parent category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "isActive",
      title: "Active",
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
      slug: "slug.current",
      category: "category.title",
    },
    prepare({ title, slug, category }) {
      return {
        title,
        subtitle: category ? `${category} / ${slug}` : slug,
      };
    },
  },
});
