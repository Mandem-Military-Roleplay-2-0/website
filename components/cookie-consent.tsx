"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Cookie } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShowConsent(true)
    }
  }, [])

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowConsent(false)

    // Enable Google Analytics or other tracking
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag("consent", "update", {
        analytics_storage: "granted",
      })
    }
  }

  const declineCookies = () => {
    localStorage.setItem("cookie-consent", "declined")
    setShowConsent(false)
  }

  return (
    <AnimatePresence>
      {showConsent && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-md"
        >
          <Card className="bg-yellow-darkest/95 backdrop-blur-md border-primary/30 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3 mb-4">
                <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-serif font-bold text-yellow-light mb-2">Používáme cookies</h3>
                  <p className="text-sm text-yellow-light/80 leading-relaxed">
                    Tento web používá cookies pro zlepšení uživatelského zážitku a analýzu návštěvnosti. Pokračováním v
                    prohlížení souhlasíte s jejich používáním.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={acceptCookies}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 font-semibold"
                >
                  Přijmout vše
                </Button>
                <Button
                  onClick={declineCookies}
                  variant="outline"
                  className="border-primary/50 text-yellow-light hover:bg-primary/20 hover:border-primary flex-1 bg-transparent"
                >
                  Odmítnout
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
