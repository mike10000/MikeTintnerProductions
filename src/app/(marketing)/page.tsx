import { Hero } from "@/components/marketing/Hero";
import { ServiceCards } from "@/components/marketing/ServiceCards";
import { AboutSection } from "@/components/marketing/AboutSection";
import { WhyUs } from "@/components/marketing/WhyUs";
import { CTA } from "@/components/marketing/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServiceCards />
      <AboutSection />
      <WhyUs />
      <CTA />
    </>
  );
}
