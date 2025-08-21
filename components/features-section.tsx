"use client"

import { Shield, Users, Zap, HeadphonesIcon, Calendar, Award } from "lucide-react"
import { SectionWrapper } from "@/components/section-wrapper"
import { AnimatedCard } from "@/components/animated-card"

const features = [
  {
    icon: Shield,
    title: "Realistický vojenský roleplay",
    description: "Autentický vojenský zážitek s hierarchií, misemi a realistickými scénáři pro skutečné vojáky.",
  },
  {
    icon: Users,
    title: "Vojenské jednotky",
    description: "Připoj se k různým vojenským jednotkám - pěchota, letectvo, námořnictvo a speciální síly.",
  },
  {
    icon: Zap,
    title: "Pokročilé vybavení",
    description: "Široká škála vojenského vybavení, vozidel a zbraní pro realistické bojové operace.",
  },
  {
    icon: HeadphonesIcon,
    title: "Vojenské mise",
    description: "Pravidelné vojenské operace, cvičení a mise pro jednotlivce i celé jednotky.",
  },
  {
    icon: Calendar,
    title: "Výcvik nováčků",
    description: "Kompletní výcvikový program pro nové rekruty s postupným kariérním růstem.",
  },
  {
    icon: Award,
    title: "Hodnostní systém",
    description: "Propracovaný systém hodností s možností postupu až na nejvyšší velitelské pozice.",
  },
]

export function FeaturesSection() {
  return (
    <SectionWrapper variant="darkest" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary/20 text-primary rounded-full text-sm font-semibold mb-6 border border-primary/30 backdrop-blur-sm">
            <Shield className="w-4 h-4 mr-2" />
            Vojenský Roleplay
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-yellow-light mb-6">
            Nejlepší vojenský zážitek
          </h2>
          <p className="text-xl text-yellow-light/80 max-w-3xl mx-auto leading-relaxed">
            Nabízíme autentické vojenské prostředí s realistickými operacemi a profesionální komunitou
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <AnimatedCard
              key={index}
              delay={index * 0.1}
              direction="up"
              className="bg-yellow-darker/60 border-yellow-dark/50 hover:border-primary/70 backdrop-blur-sm"
            >
              <div className="p-8">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center group-hover:bg-primary/30 transition-colors duration-300 mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-yellow-light mb-3">{feature.title}</h3>
                </div>
                <p className="text-yellow-light/70 leading-relaxed text-base">{feature.description}</p>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
