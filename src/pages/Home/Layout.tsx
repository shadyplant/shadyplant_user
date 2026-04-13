import Hero from "./components/1_Hero_Section";
import ProcessSection from "./components/2_Section";
import NurseryFeatures from "./components/3_Section";
import AboutSection from "./components/4_Section";
import EstimateSection from "./components/5_Section";
import FAQSection from "./components/6_Section";
import SiteShell from "@/components/SiteShell";

export default function HomePage() {
  return (
    <SiteShell>
      <Hero />
      <ProcessSection />
      <NurseryFeatures />
      <AboutSection />
      <EstimateSection />
      <FAQSection />
    </SiteShell>
  );
}
