import Hero from "@/components/LandingPage/Hero";
import AbayaCarousel from "@/components/LandingPage/AbayaCarousel";
import CordSetCarousel from "@/components/LandingPage/CordSetCarousel";
import MediaGridOne from "@/components/LandingPage/MediaGridOne";
import TopsCarousel from "@/components/LandingPage/TopsCarousel";
import MediaGridTwo from "@/components/LandingPage/MediaGridTwo";
export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Hero />
      <AbayaCarousel />
      <CordSetCarousel />
      <MediaGridOne />
      <TopsCarousel />
      <MediaGridTwo />
    </div>
  );
}
