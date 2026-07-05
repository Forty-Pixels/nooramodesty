import "server-only";

import { sanityClient } from "@/lib/sanity/client";
import { shippingAndReturnPolicy } from "@/data/policies";
import { PolicyPageContent, PolicySection } from "@/types/policy";

const shippingReturnPolicyQuery = `*[_type == "shippingReturnPolicy"][0]{
  title,
  eyebrow,
  intro,
  updatedAt,
  sections[]{title, body}
}`;

interface ShippingReturnPolicyDoc {
  title?: string;
  eyebrow?: string;
  intro?: string;
  updatedAt?: string;
  sections?: Array<{ title?: string; body?: string }>;
}

export async function fetchShippingReturnPolicy(): Promise<PolicyPageContent> {
  if (!sanityClient) {
    return shippingAndReturnPolicy;
  }

  const doc = await sanityClient.fetch<ShippingReturnPolicyDoc | null>(
    shippingReturnPolicyQuery,
    {},
    { next: { revalidate: 60, tags: ["shippingReturnPolicy"] } },
  );

  const sections: PolicySection[] = (doc?.sections || [])
    .filter((section): section is { title: string; body: string } => Boolean(section?.title && section?.body))
    .map((section, index) => ({
      _id: `shipping-return-policy-section-${index}`,
      title: section.title,
      body: section.body,
    }));

  if (!doc || sections.length === 0) {
    return shippingAndReturnPolicy;
  }

  return {
    _id: shippingAndReturnPolicy._id,
    slug: shippingAndReturnPolicy.slug,
    title: doc.title || shippingAndReturnPolicy.title,
    eyebrow: doc.eyebrow || shippingAndReturnPolicy.eyebrow,
    intro: doc.intro || shippingAndReturnPolicy.intro,
    updatedAt: doc.updatedAt || shippingAndReturnPolicy.updatedAt,
    sections,
  };
}
