import { HeroSection } from "@/components/HeroSection";
import { StatsSection } from "@/components/StatsSection";
import { ChallengeSection } from "@/components/ChallengeSection";
import { SolutionSection } from "@/components/SolutionSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { RegionsSection } from "@/components/RegionsSection";
import { ContactCTA } from "@/components/ContactCTA";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <StatsSection />
      <ChallengeSection />
      <SolutionSection />
      <FeaturesSection />
      <HowItWorksSection />
      <RegionsSection />
      <ContactCTA />
    </div>
  );
}
