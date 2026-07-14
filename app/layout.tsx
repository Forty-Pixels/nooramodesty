import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { MetaPixel } from "@/components/Analytics/MetaPixel";
import Navbar from "@/components/Navbar/Navbar";
import { Footer } from "@/components/LandingPage/Footer";
import { analytics } from "@/data/analytics";
import { siteLinks } from "@/data/siteLinks";
import { fetchPublicSiteSettings } from "@/lib/server/siteSettings";
import { getCategoryNavigation } from "@/lib/sanity/categoryNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Noora Modesty | Premium Modest Wear",
  description: "Experience the elegance of premium modest fashion. Curated abayas, cord sets, and tops designed for the modern woman.",
  icons: {
    icon: [
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon/favicon-16x16-dark.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon/favicon-32x32-dark.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon/favicon.ico", sizes: "any" },
    ],
    apple: "/favicon/apple-touch-icon.png",
  },
  manifest: "/favicon/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import PageTransitionProvider from "@/components/Providers/PageTransitionProvider";
import { ScrollToTop } from "@/components/Providers/ScrollToTop";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteSettings, categories] = await Promise.all([
    fetchPublicSiteSettings(),
    getCategoryNavigation(),
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <MetaPixel pixelId={analytics.metaPixelId} />
        <ScrollToTop />
        {siteSettings.announcementEnabled && (
          <AnnouncementBar text={siteSettings.announcementText} href={siteSettings.announcementHref} />
        )}
        <Navbar categories={categories} />
        <main className="flex-grow overflow-x-clip">
          <PageTransitionProvider>
            {children}
            <Footer links={siteLinks} />
          </PageTransitionProvider>
        </main>
      </body>
    </html>
  );
}
