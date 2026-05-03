import Hero from "@/components/LandingPage/Hero";
import AbayaCarousel from "@/components/LandingPage/AbayaCarousel";
import CordSetCarousel from "@/components/LandingPage/CordSetCarousel";
import { OccasionWearCarousel } from "@/components/LandingPage/OccasionWearCarousel";
import TopsCarousel from "@/components/LandingPage/TopsCarousel";
import MediaCarousel from "@/components/LandingPage/MediaCarousel";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <AbayaCarousel />
      <CordSetCarousel />
      <OccasionWearCarousel />
      <TopsCarousel />
      <MediaCarousel />
    </div>
  );
}
