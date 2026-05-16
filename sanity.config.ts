"use client";

import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { categoryStructure } from "@/sanity/lib/categoryStructure";
import { ordersTool } from "@/sanity/plugins/ordersTool";
import { schemaTypes } from "@/sanity/schemas";

export default defineConfig({
  name: "nooraModesty",
  title: "Noora Modesty",
  basePath: "/studio",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  plugins: [structureTool(), ordersTool()],
  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      ...categoryStructure.map((category) => ({
        id: `category-${category.slug}`,
        title: category.title,
        schemaType: "category",
        value: {
          title: category.title,
          slug: { _type: "slug", current: category.slug },
          isActive: true,
          showInNavigation: true,
          showOnHomepage: true,
        },
      })),
    ],
  },
});
