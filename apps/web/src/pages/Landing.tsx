import ScrollSection from "@/components/ScrollSection";
import FeatureSection from "@/components/FeatureSection";
import HeroSection from "@/components/HeroSection";
import Navbar from "@/components/Navbar";
import InviteSection from "@/components/InviteSection";
import Footer from "@/components/Footer";

export default function Landing() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <ScrollSection />
      <FeatureSection />
      <InviteSection />
      <Footer />
    </>
  );
}