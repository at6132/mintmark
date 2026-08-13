import { HomeHero } from "@/components/HomeHero";
import { HomeNewsroom } from "@/components/HomeNewsroom";
import { AdBanner } from "@/components/AdBanner";
import { InlineEmail } from "@/components/InlineEmail";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeNewsroom />
      <AdBanner />
      <InlineEmail />
    </>
  );
}
