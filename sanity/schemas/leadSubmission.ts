import { defineField, defineType } from "sanity";

export const leadSubmissionAttachment = defineType({
  name: "leadSubmissionAttachment",
  title: "Lead submission attachment",
  type: "object",
  fields: [
    defineField({
      name: "file",
      title: "File",
      type: "file",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "filename",
      title: "Filename",
      type: "string",
    }),
  ],
  preview: {
    select: {
      title: "filename",
    },
  },
});

export const leadSubmission = defineType({
  name: "leadSubmission",
  title: "Lead submissions",
  type: "document",
  fields: [
    defineField({
      name: "source",
      title: "Source",
      type: "string",
      options: {
        list: [
          { title: "Newsletter signup", value: "newsletter" },
          { title: "General inquiry", value: "inquiry" },
          { title: "Suggestion / feedback", value: "suggestion" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "name", title: "Name", type: "string" }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "phone", title: "Phone", type: "string" }),
    defineField({ name: "subject", title: "Subject", type: "string" }),
    defineField({
      name: "message",
      title: "Message",
      type: "text",
      rows: 5,
    }),
    defineField({
      name: "suggestionType",
      title: "Suggestion type",
      type: "string",
      options: {
        list: [
          { title: "General", value: "general" },
          { title: "Design specific", value: "design" },
        ],
      },
    }),
    defineField({
      name: "attachments",
      title: "Attachments",
      type: "array",
      of: [{ type: "leadSubmissionAttachment" }],
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Reviewed", value: "reviewed" },
          { title: "Closed", value: "closed" },
        ],
      },
      initialValue: "new",
    }),
    defineField({
      name: "createdAt",
      title: "Created at",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      source: "source",
      email: "email",
      subject: "subject",
    },
    prepare({ source, email, subject }) {
      return {
        title: subject || email,
        subtitle: source,
      };
    },
  },
});
