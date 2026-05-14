import Hero from "@/components/LandingPage/Hero";
import MediaCarousel from "@/components/LandingPage/MediaCarousel";
import { InNoora } from "@/components/LandingPage/InNoora";
import { HomepageProductSection } from "@/components/LandingPage/HomepageProductSection";
import { getHomepageContent } from "@/lib/sanity/homepage";

export default async function Home() {
  const homepage = await getHomepageContent();

  return (
    <div className="flex flex-col min-h-screen">
      <Hero
        imageOneSrc={homepage.hero.imageOneSrc}
        imageTwoSrc={homepage.hero.imageTwoSrc}
        centerLogoSrc={homepage.hero.centerLogoSrc}
        ctaLabel={homepage.hero.ctaLabel}
        ctaHref={homepage.hero.ctaHref}
      />
      {homepage.productSections.map((section) => (
        <HomepageProductSection
          key={section._key}
          title={section.title}
          products={section.products}
        />
      ))}
      <MediaCarousel />
      <InNoora images={homepage.inNooraImages} />
    </div>
  );
}
