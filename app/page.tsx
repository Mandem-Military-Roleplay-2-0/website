import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { StatsSection } from "@/components/stats-section"
import { FeaturesSection } from "@/components/features-section"
import { JobsSection } from "@/components/jobs-section"
import { CallToActionSection } from "@/components/call-to-action-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <CallToActionSection />
      <Footer />
    </main>
  )
}
