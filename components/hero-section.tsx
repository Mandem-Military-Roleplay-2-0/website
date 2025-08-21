"use client"

import { Button } from "@/components/ui/button"
import { Play, Users, Server } from "lucide-react"
import { motion } from "framer-motion"

export function HeroSection() {
  return (
    <section className="relative h-[70vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <video
          className="w-full h-full object-cover"
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      </div>


      {/* Content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-primary/50 mb-4 md:mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-primary drop-shadow-lg">Mandem Military RP</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-secondary-foreground mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Zažij nejlepší vojenský roleplay zážitek. Připoj se k naší komunitě a začni svou cestu.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 md:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 px-8 py-4 text-lg font-semibold w-full sm:w-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              Začít hrát
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:scale-105 px-8 py-4 text-lg font-semibold bg-yellow-darkest/50 backdrop-blur-sm w-full sm:w-auto rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Users className="mr-2 h-5 w-5" />
              Discord
            </Button>
          </motion.div>

          {/* Server Info */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-3 text-yellow-light/90"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-primary" />
              <span className="text-lg font-medium">IP adresa serveru:</span>
            </div>
            <code className="bg-yellow-darkest/80 backdrop-blur-sm px-4 py-2 rounded-lg text-primary font-mono text-base border border-primary/50 shadow-lg">
              play.mandemmilitary.cz
            </code>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center backdrop-blur-sm bg-yellow-darkest/30">
          <motion.div
            className="w-1 h-3 bg-primary rounded-full mt-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  )
}
