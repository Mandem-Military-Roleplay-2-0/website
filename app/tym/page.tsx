import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { TeamGrid } from "@/components/team-grid"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Náš tým | Mandem Military",
  description: "Seznamte se s týmem administrátorů a moderátorů serveru Mandem Military.",
  openGraph: {
    title: "Náš tým | Mandem Military",
    description: "Seznamte se s týmem administrátorů a moderátorů serveru Mandem Military.",
  },
}

export default function TeamPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <section className="py-20 section-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Náš tým</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Seznamte se s lidmi, kteří se starají o chod serveru a komunity
              </p>
            </div>
            <TeamGrid />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
