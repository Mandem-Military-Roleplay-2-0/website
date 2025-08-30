import type React from "react"
import type { Metadata, Viewport } from "next"
import { DM_Sans, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { CookieConsent } from "@/components/cookie-consent"
import Head from "next/head"
import Script from "next/script"

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

export const viewport: Viewport = {
  themeColor: "#ffba00",
}

const siteNavigation = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": [
      {
        "@type": "SiteNavigationElement",
        "position": 1,
        "name": "Domů",
        "url": "https://mandemmilitary.cz"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 2,
        "name": "Pravidla",
        "url": "https://mandemmilitary.cz/pravidla"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 3,
        "name": "Galerie",
        "url": "https://mandemmilitary.cz/galerie"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 4,
        "name": "Tým",
        "url": "https://mandemmilitary.cz/tym"
      },
      {
        "@type": "SiteNavigationElement",
        "position": 5,
        "name": "Kontakt",
        "url": "https://mandemmilitary.cz/kontakt"
      }
    ]
  };

export const metadata: Metadata = {
  title: "Mandem Military | FiveM Military Server",
  description:
    "Připojte se k nejlepšímu vojenskému FiveM serveru. Mandem Military nabízí realistický vojenský roleplay s aktivní komunitou a profesionálním přístupem.",
  keywords: "FiveM, vojenský server, roleplay, Mandem Military, GTA V, multiplayer, military",
  authors: [{ name: "L3" }],
  creator: "Mandem Military",
  publisher: "Mandem Military",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.mandemmilitary.cz"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Mandem Military | FiveM Military Roleplay",
    description:
      "Připojte se k nejlepšímu vojenskému FiveM serveru. Realistický vojenský roleplay s aktivní komunitou.",
    url: "https://www.mandemmilitary.cz",
    siteName: "Mandem Military",
    images: [
      {
        url: "/logo.png",
        alt: "Mandem Military FiveM Server",
      },
    ],
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mandem Military | FiveM Vojenský Server",
    description:
      "Připojte se k nejlepšímu vojenskému FiveM serveru. Realistický vojenský roleplay s aktivní komunitou.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" className={`${dmSans.variable} ${spaceGrotesk.variable} dark`}>
      <Head>
          <Script id="site-nav-schema" type="application/ld+json">
            {JSON.stringify(siteNavigation).replace(/</g, '\\u003c')}
          </Script>
      </Head>
      <body className="antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
