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
        "Delivery timelines depend on product availability, destination, courier schedules, and order volume. If an order takes extra time please feel free to contact our support through email or WhatsApp channels and an agent will get in touch with you.",
    },
    {
      _id: "returns",
      title: "Returns",
      body:
        "Return requests must be made within 14 days of receiving your order. Items must be unused, unworn, unwashed, and have all tags intact. When returning, please include the original packaging and the courier bag, as it contains the necessary order number for processing.",
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

export const privacyPolicy: PolicyPageContent = {
  _id: "policy-privacy",
  title: "Privacy Policy",
  slug: "privacy-policy",
  eyebrow: "Personal Data",
  updatedAt: "May 2026",
  intro:
    "This Privacy Policy describes how Noora Modesty collects, uses, and protects your information when you visit our site or make a purchase.",
  sections: [
    {
      _id: "collection",
      title: "Information We Collect",
      body:
        "When you visit Noora Modesty, we collect certain information about your device, your interaction with the site, and information necessary to process your purchases. We may also collect additional information if you contact us for customer support.",
    },
    {
      _id: "usage",
      title: "How We Use Your Information",
      body:
        "We use your personal information to provide our services to you, which includes: offering products for sale, processing payments, shipping and fulfillment of your order, and keeping you up to date on new products, services, and offers.",
    },
    {
      _id: "security",
      title: "Data Security",
      body:
        "We take the security of your personal information seriously and use industry-standard measures to protect it. However, no method of transmission over the internet or electronic storage is 100% secure.",
    },
    {
      _id: "contact",
      title: "Contact Us",
      body:
        "For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at hello@nooramodesty.com.",
    },
  ],
};
