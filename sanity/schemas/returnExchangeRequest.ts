import { defineField, defineType } from "sanity";

export const returnExchangeRequest = defineType({
  name: "returnExchangeRequest",
  title: "Return / Exchange Request",
  type: "document",
  fields: [
    defineField({
      name: "requestType",
      title: "Request type",
      type: "string",
      options: {
        list: [
          { title: "Return", value: "return" },
          { title: "Exchange", value: "exchange" },
        ],
      },
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      initialValue: "pending",
      options: {
        list: [
          { title: "Pending", value: "pending" },
          { title: "Approved", value: "approved" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "orderNumber", title: "Order number", type: "string", readOnly: true, validation: (rule) => rule.required() }),
    defineField({ name: "customerName", title: "Customer name", type: "string", readOnly: true, validation: (rule) => rule.required() }),
    defineField({ name: "phone", title: "Phone", type: "string", readOnly: true, validation: (rule) => rule.required() }),
    defineField({ name: "reason", title: "Reason", type: "string", readOnly: true, validation: (rule) => rule.required() }),
    defineField({ name: "details", title: "Details", type: "text", readOnly: true, validation: (rule) => rule.required() }),
    defineField({ name: "createdAt", title: "Created at", type: "datetime", readOnly: true, validation: (rule) => rule.required() }),
  ],
  preview: {
    select: {
      title: "orderNumber",
      subtitle: "customerName",
      requestType: "requestType",
      status: "status",
    },
    prepare(selection) {
      const { title, subtitle, requestType, status } = selection;
      return {
        title,
        subtitle: `${requestType || "request"} - ${status || "pending"} - ${subtitle || "Unknown customer"}`,
      };
    },
  },
});
