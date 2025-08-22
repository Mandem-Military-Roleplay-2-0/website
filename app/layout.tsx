import type React from "react"
import type { Metadata, Viewport } from "next"
import { DM_Sans, Space_Grotesk } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { CookieConsent } from "@/components/cookie-consent"
import { GoogleTagManager } from "@/components/google-tag-manager"

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
  themeColor: "#ffba00", // sem patří barva
}

export const metadata: Metadata = {
  title: "Mandem Military | FiveM Military Server",
  description:
    "Připojte se k nejlepšímu vojenskému FiveM serveru. Mandem Military nabízí realistický vojenský roleplay s aktivní komunitou a profesionálním přístupem.",
  keywords: "FiveM, vojenský server, roleplay, Mandem Military, GTA V, multiplayer, vojenská simulace",
  authors: [{ name: "Mandem Military Team" }],
  creator: "Mandem Military",
  publisher: "Mandem Military",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://mandemmilitary.cz"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Mandem Military | FiveM Military Roleplay",
    description:
      "Připojte se k nejlepšímu vojenskému FiveM serveru. Realistický vojenský roleplay s aktivní komunitou.",
    url: "https://mandemmilitary.cz",
    siteName: "Mandem Military",
    images: [
      {
        url: "/mandemLogo2.png",
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
    images: ["/mandemLogo2.png"],
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
      <head>
        <GoogleTagManager />
      </head>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
