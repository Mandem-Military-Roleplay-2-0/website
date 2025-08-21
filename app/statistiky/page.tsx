import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { StatsGrid } from "@/components/stats-grid"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Statistiky serveru | Mandem Military",
  description: "Aktuální statistiky našeho FiveM serveru - počet hráčů, uptime, a další důležité informace.",
}

export default function StatsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Statistiky serveru</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Aktuální informace o našem serveru a komunitě
              </p>
            </div>
            <StatsGrid />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
