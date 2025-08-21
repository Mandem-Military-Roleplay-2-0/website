"use client"

import Link from "next/link"
import { Shield, DiscIcon as Discord, Youtube, Instagram } from "lucide-react"
import Image from "next/image"
export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    komunita: [
      { label: "Discord", href: "#" },
      { label: "Fórum", href: "#" },
      { label: "Tým", href: "/tym" },
      { label: "Statistiky", href: "/statistiky" },
    ],
    podpora: [
      { label: "Pravidla", href: "/pravidla" },
      { label: "Často kladené otázky", href: "#" },
      { label: "Kontakt", href: "#" },
      { label: "Nahlásit problém", href: "#" },
    ],
  }

  return (
    <footer className="bg-background/95 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="/logo.png"
                alt="Mandem Military Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <span className="font-serif font-bold text-xl text-foreground">Mandem Military</span>
            </Link>
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
              Nejlepší vojenský roleplay server v České republice s aktivní komunitou a profesionálním přístupem k
              hernímu zážitku.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Discord className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Community Links */}
          <div>
            <h3 className="font-serif font-bold text-foreground mb-4">Komunita</h3>
            <ul className="space-y-2">
              {footerLinks.komunita.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-serif font-bold text-foreground mb-4">Podpora</h3>
            <ul className="space-y-2">
              {footerLinks.podpora.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">© {currentYear} Mandem Military. Všechna práva vyhrazena.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Zásady ochrany osobních údajů
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Podmínky použití
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
