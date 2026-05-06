import type { PolicyPageContent } from "@/types/policy";

export const termsAndConditionsPolicy: PolicyPageContent = {
  _id: "policy-terms-and-conditions",
  title: "Terms & Conditions",
  slug: "terms-and-conditions",
  eyebrow: "Noora Modesty",
  updatedAt: "May 2026",
  intro:
    "These terms outline how purchases, payments, order handling, and customer responsibilities work when shopping with Noora Modesty.",
  sections: [
    {
      _id: "orders",
      title: "Orders",
      body:
        "Orders are confirmed once payment details and product availability are verified. If an item becomes unavailable after checkout, our team will contact you with the closest available option or next step.",
    },
    {
      _id: "product-details",
      title: "Product Details",
      body:
        "We aim to present product colors, sizing, materials, and pricing clearly. Slight color variation can occur because of lighting, photography, fabric finish, and screen settings.",
    },
    {
      _id: "payments",
      title: "Payments",
      body:
        "Customers are responsible for providing accurate billing, delivery, and contact details. Orders may be paused or cancelled if payment or contact information cannot be verified.",
    },
    {
      _id: "changes",
      title: "Changes To Terms",
      body:
        "Noora Modesty may update these terms as services, policies, or operations change. The latest published version applies to future purchases.",
    },
  ],
};

export const shippingAndReturnPolicy: PolicyPageContent = {
  _id: "policy-shipping-and-return",
  title: "Shipping & Return Policy",
  slug: "shipping-and-return-policy",
  eyebrow: "Delivery & Care",
  updatedAt: "May 2026",
  intro:
    "This policy covers delivery timelines, order handling, exchanges, and return requests for Noora Modesty purchases.",
  sections: [
    {
      _id: "delivery",
      title: "Delivery",
      body:
        "Delivery timelines depend on product availability, destination, courier schedules, and order volume. We will contact you if a confirmed order requires extra processing time.",
    },
    {
      _id: "returns",
      title: "Returns",
      body:
        "Return requests should be made promptly after receiving the order. Items must be unused, unworn, unwashed, and returned with original packaging where applicable.",
    },
    {
      _id: "exchanges",
      title: "Exchanges",
      body:
        "Size or product exchanges depend on stock availability. If the requested replacement is unavailable, our team will help confirm the most suitable alternative.",
    },
    {
      _id: "exceptions",
      title: "Exceptions",
      body:
        "Customized, altered, final sale, damaged-through-use, or hygiene-sensitive items may not be eligible for return unless required by applicable consumer protection rules.",
    },
  ],
};
