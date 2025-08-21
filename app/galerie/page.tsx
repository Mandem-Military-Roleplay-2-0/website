import { Navigation } from "@/components/navigation"
import { Footer } from "@/components/footer"
import { GalleryGrid } from "@/components/gallery-grid"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Galerie | Mandem Military",
  description:
    "Prohlédněte si fotografie a screenshoty z našeho FiveM serveru. Nejlepší momenty z vojenského roleplay.",
}

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-16">
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Galerie</h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Prohlédněte si nejlepší momenty z našeho serveru zachycené našimi hráči
              </p>
            </div>
            <GalleryGrid />
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
