import { defineField, defineType } from "sanity";

export const coupon = defineType({
  name: "coupon",
  title: "Coupon",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Code",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "discountType",
      title: "Discount type",
      type: "string",
      options: {
        list: [
          { title: "Fixed", value: "fixed" },
          { title: "Percentage", value: "percentage" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "discountValue",
      title: "Discount value",
      type: "number",
      validation: (rule) => rule.required().min(0),
    }),
    defineField({ name: "isActive", title: "Active", type: "boolean", initialValue: true }),
    defineField({ name: "startsAt", title: "Starts at", type: "datetime" }),
    defineField({ name: "expiresAt", title: "Expires at", type: "datetime" }),
    defineField({ name: "usesCount", title: "Uses count", type: "number", initialValue: 0 }),
    defineField({ name: "maxUses", title: "Max uses", type: "number" }),
    defineField({ name: "minimumSubtotal", title: "Minimum subtotal", type: "number" }),
  ],
  preview: {
    select: {
      title: "code",
      subtitle: "discountType",
    },
  },
});
