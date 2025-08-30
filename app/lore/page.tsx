import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import type { Metadata } from "next"
import { LoreSection } from "@/components/lore-section"

export const metadata: Metadata = {
  title: "Lore serveru | Mandem Military",
  description: "Přečtěte si lore našeho FiveM serveru. Důležité informace pro všechny hráče Mandem Military.",
  openGraph: {
    title: "Lore serveru | Mandem Military",
    description: "Přečtěte si lore našeho FiveM serveru. Důležité informace pro všechny hráče Mandem Military.",
  },
}

export default function LorePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <section className="py-20 section-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Lore serveru</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Přečtěte si důležitou historii a příběh našeho serveru. Lore je klíčovou součástí zážitku pro všechny hráče.
              </p>
            </div>
            <LoreSection />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
