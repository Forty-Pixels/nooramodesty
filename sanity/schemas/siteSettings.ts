import { defineField, defineType } from "sanity";

export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({ name: "whatsappNumber", title: "WhatsApp number", type: "string" }),
    defineField({ name: "bankName", title: "Bank name", type: "string" }),
    defineField({ name: "bankAccountName", title: "Bank account name", type: "string" }),
    defineField({ name: "bankAccountNumber", title: "Bank account number", type: "string" }),
    defineField({ name: "bankBranch", title: "Bank branch", type: "string" }),
    defineField({
      name: "customSizeCharge",
      title: "Custom size charge",
      type: "number",
      initialValue: 850,
    }),
    defineField({
      name: "customSizeDispatchDays",
      title: "Custom size dispatch days",
      type: "number",
      initialValue: 14,
    }),
    defineField({
      name: "bankTransferDeadlineDays",
      title: "Bank transfer deadline days",
      type: "number",
      initialValue: 3,
    }),
    defineField({
      name: "isStoreLocatorActive",
      title: "Enable Store Locator",
      type: "boolean",
      description: "Enable this to show the Store Locator page, footer links, and out-of-stock size popups on the website. Turn off to hide them.",
      initialValue: false,
    }),
  ],
});
