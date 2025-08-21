import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { RulesSection } from "@/components/rules-section"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pravidla serveru | Mandem Military",
  description: "Přečtěte si pravidla našeho FiveM serveru. Důležité informace pro všechny hráče Mandem Military.",
}

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Pravidla serveru</h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Přečtěte si důležitá pravidla pro hru na našem serveru. Dodržování pravidel zajišťuje příjemný zážitek
                pro všechny hráče.
              </p>
            </div>
            <RulesSection />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
