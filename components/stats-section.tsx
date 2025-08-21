"use client"

import { AnimatedCounter } from "@/components/animated-counter"
import { SectionWrapper } from "@/components/section-wrapper"
import { AnimatedCard } from "@/components/animated-card"

interface StatItemProps {
  value: number
  suffix?: string
  label: string
  delay?: number
}

function StatItem({ value, suffix = "", label, delay = 0 }: StatItemProps) {
  return (
    <AnimatedCard
      delay={delay}
      direction="scale"
      className="bg-yellow-darker/40 border-yellow-dark/50 hover:border-primary/70 backdrop-blur-sm"
    >
      <div className="text-center p-6 md:p-8">
        <div className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary mb-3 transition-transform duration-300 group-hover:scale-110">
          <AnimatedCounter end={value} suffix={suffix} />
        </div>
        <div className="text-yellow-light/90 text-lg font-medium">{label}</div>
      </div>
    </AnimatedCard>
  )
}

export function StatsSection() {
  return (
    <SectionWrapper variant="medium" className="py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
            Naše komunita v číslech
          </h2>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Připoj se k rostoucí komunitě vojenských nadšenců
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <StatItem value={150} suffix="+" label="Aktivních hráčů" delay={0.1} />
          <StatItem value={24} suffix="/7" label="Online server" delay={0.2} />
          <StatItem value={50} suffix="+" label="Vojenských pozic" delay={0.3} />
          <StatItem value={99.9} suffix="%" label="Uptime" delay={0.4} />
        </div>
      </div>
    </SectionWrapper>
  )
}
