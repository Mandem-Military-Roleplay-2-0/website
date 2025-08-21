"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Download } from "lucide-react"

export function CallToActionSection() {
  return (
    <section className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
          Připoj se ještě dnes
        </div>

        <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6">Začni svou cestu ještě dnes</h2>

        <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
          Zapoj se do FiveM a připoj se k naší komunitě. Tvoje roleplay dobrodružství začíná právě teď!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-lg">
            <ArrowRight className="mr-2 h-5 w-5" />
            Připojit se na server
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3 text-lg bg-transparent"
          >
            <Download className="mr-2 h-5 w-5" />
            Přijmout na server
          </Button>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-2">IP adresa serveru:</p>
          <code className="bg-card px-4 py-2 rounded-lg text-primary font-mono text-lg">play.mandemmilitary.cz</code>
        </div>
      </div>
    </section>
  )
}
