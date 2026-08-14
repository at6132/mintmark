import { HomeHero } from "@/components/HomeHero";
import { HomeNewsroom } from "@/components/HomeNewsroom";
import { InlineEmail } from "@/components/InlineEmail";

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeNewsroom />
      <InlineEmail />
    </>
  );
}
