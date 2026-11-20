import { Hero } from "@/components/home/Hero";
import { PopularTools } from "@/components/home/PopularTools";
import { DropZone } from "@/components/home/DropZone";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { PrivacySection } from "@/components/home/PrivacySection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PopularTools />
      <DropZone />
      <CategoryGrid />
      <PrivacySection />
    </>
  );
}
