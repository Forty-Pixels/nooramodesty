import type { SiteLinks } from "@/types/siteLinks";

const whatsappNumber = "94777828836";

const whatsappHref = (message: string) =>
  `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

export const siteLinks: SiteLinks = {
  contactPhone: "+94 777 828 836",
  social: [
    {
      label: "Instagram",
      href: "https://www.instagram.com/noora.modesty?igsh=YzlpdTNmdWpnZHR5",
      isExternal: true,
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/share/1B7KLNCxto/?mibextid=wwXIfr",
      isExternal: true,
    },
    {
      label: "WhatsApp",
      href: whatsappHref("Hi Noora Modesty, I would like to get in touch."),
      isExternal: true,
    },
  ],
  site: [
    { label: "Home", href: "/" },
    { label: "Catalog", href: "/category/abayas" },
    { label: "Product", href: "/product/abaya-one" },
    { label: "Shipping & Returns", href: "/shipping-and-return-policy" },
    { label: "Privacy Policy", href: "/privacy-policy" },
  ],
  legal: [
    {
      label: "Terms & Conditions",
      href: "/terms-and-conditions",
    },
    {
      label: "Shipping & Return Policy",
      href: "/shipping-and-return-policy",
    },
    {
      label: "Privacy Policy",
      href: "/privacy-policy",
    },
    {
      label: "Returns & Cancellations",
      href: "/returns-and-cancellations",
    },
  ],
  support: [
    {
      label: "Shipping & Returns Policy",
      href: "/shipping-and-return-policy",
    },
    {
      label: "Returns & Cancellations",
      href: "/returns-and-cancellations",
    },
    {
      label: "Privacy Policy",
      href: "/privacy-policy",
    },
    {
      label: "Need help? Contact Support",
      href: whatsappHref("Hi Noora Modesty, I need support with my order."),
      isExternal: true,
    },
  ],
};
