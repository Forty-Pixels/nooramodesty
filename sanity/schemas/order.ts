import { defineField, defineType } from "sanity";
import { PaymentSlipPreview } from "../components/PaymentSlipPreview";

export const orderItem = defineType({
  name: "orderItem",
  title: "Order item",
  type: "object",
  fields: [
    defineField({ name: "productId", title: "Product ID", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "title", title: "Title", type: "string", validation: (rule) => rule.required() }),
    defineField({ name: "slug", title: "Slug", type: "string" }),
    defineField({ name: "image", title: "Image", type: "url" }),
    defineField({ name: "clickomProductId", title: "Clickom product ID", type: "number", validation: (rule) => rule.required() }),
    defineField({ name: "clickomVariationId", title: "Clickom variation ID", type: "number", validation: (rule) => rule.required() }),
    defineField({ name: "quantity", title: "Quantity", type: "number", validation: (rule) => rule.required().min(1) }),
    defineField({ name: "unitPrice", title: "Unit price", type: "number", validation: (rule) => rule.required().min(0) }),
    defineField({ name: "selectedColor", title: "Selected color", type: "string" }),
    defineField({ name: "selectedSize", title: "Selected size", type: "string" }),
    defineField({ name: "customSize", title: "Custom size", type: "boolean", initialValue: false }),
    defineField({ name: "customNote", title: "Custom note", type: "text" }),
  ],
});

export const order = defineType({
  name: "order",
  title: "Order",
  type: "document",
  fields: [
    defineField({ name: "orderNumber", title: "Order number", type: "string", validation: (rule) => rule.required() }),
    defineField({
      name: "customer",
      title: "Customer",
      type: "object",
      fields: [
        defineField({ name: "fullName", title: "Full name", type: "string" }),
        defineField({ name: "mobile", title: "Mobile", type: "string" }),
        defineField({ name: "email", title: "Email", type: "string" }),
        defineField({ name: "addressLine1", title: "Address line 1", type: "string" }),
        defineField({ name: "addressLine2", title: "Address line 2", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "zipCode", title: "Zip code", type: "string" }),
      ],
    }),
    defineField({ name: "items", title: "Items", type: "array", of: [{ type: "orderItem" }] }),
    defineField({
      name: "paymentMethod",
      title: "Payment method",
      type: "string",
      options: {
        list: [
          { title: "Cash on Delivery", value: "cod" },
          { title: "Bank Transfer", value: "bank_transfer" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "paymentSlip",
      title: "Payment slip",
      type: "file",
      description: "Uploaded bank transfer receipt. Use the Payment slip URL field below for a direct browser link.",
    }),
    defineField({
      name: "paymentSlipUrl",
      title: "Payment slip preview",
      type: "url",
      readOnly: true,
      description: "Images render inline. PDFs and other files open as a link.",
      components: {
        input: PaymentSlipPreview,
      },
    }),
    defineField({ name: "paymentSlipUploadedAt", title: "Payment slip uploaded at", type: "datetime" }),
    defineField({
      name: "adminStatus",
      title: "Admin status",
      type: "string",
      initialValue: "pending_approval",
      options: {
        list: [
          { title: "Pending approval", value: "pending_approval" },
          { title: "Approved", value: "approved" },
          { title: "Rejected", value: "rejected" },
        ],
      },
    }),
    defineField({
      name: "status",
      title: "Order status",
      type: "string",
      initialValue: "pending",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Processing", value: "processing" },
          { title: "Shipped", value: "shipped" },
          { title: "Completed", value: "completed" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
    }),
    defineField({ name: "clickomSaleId", title: "Clickom sale ID", type: "string" }),
    defineField({ name: "placedAt", title: "Placed at", type: "datetime" }),
    defineField({ name: "approvedAt", title: "Approved at", type: "datetime" }),
    defineField({ name: "couponCode", title: "Coupon code", type: "string" }),
    defineField({ name: "discountAmount", title: "Discount amount", type: "number", initialValue: 0 }),
    defineField({ name: "totalAmount", title: "Total amount", type: "number", validation: (rule) => rule.required().min(0) }),
  ],
  preview: {
    select: {
      title: "orderNumber",
      subtitle: "customer.fullName",
    },
  },
});
