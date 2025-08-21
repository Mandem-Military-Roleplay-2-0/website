"use client"

import { Crown, Shield, Plane, FlagIcon as Parachute, Target, Bomb, Radio, Heart } from "lucide-react"
import { SectionWrapper } from "@/components/section-wrapper"
import { AnimatedCard } from "@/components/animated-card"

const jobs = [
  {
    icon: Crown,
    title: "Velitel jednotky",
    description: "Veď vojenskou jednotku a koordinuj operace",
    color: "text-primary",
  },
  {
    icon: Shield,
    title: "Pěší voják",
    description: "Základní vojenská pozice pro nové rekruty",
    color: "text-yellow-light",
  },
  {
    icon: Plane,
    title: "Pilot",
    description: "Pilotuj vojenská letadla a helikoptéry",
    color: "text-primary",
  },
  {
    icon: Parachute,
    title: "Výsadkář",
    description: "Speciální jednotka pro vzdušné operace",
    color: "text-yellow-light",
  },
  {
    icon: Target,
    title: "Odstřelovač",
    description: "Specializace na dálkové eliminace cílů",
    color: "text-primary",
  },
  {
    icon: Bomb,
    title: "Pyrotechnik",
    description: "Expert na výbušniny a demolice",
    color: "text-yellow-light",
  },
  {
    icon: Radio,
    title: "Komunikační důstojník",
    description: "Zajišťuj komunikaci mezi jednotkami",
    color: "text-primary",
  },
  {
    icon: Heart,
    title: "Vojenský medik",
    description: "Poskytuj lékařskou péči na bojišti",
    color: "text-yellow-light",
  },
]

export function JobsSection() {
  return (
    <SectionWrapper variant="medium" className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-yellow-darkest/30 text-yellow-darkest rounded-full text-sm font-semibold mb-6 border border-yellow-darkest/40 backdrop-blur-sm">
            <Crown className="w-4 h-4 mr-2" />
            Vojenské pozice
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-yellow-darkest mb-6">
            Vojenské specializace
          </h2>
          <p className="text-xl text-yellow-darkest/80 max-w-3xl mx-auto leading-relaxed">
            Vyberte si z široké škály vojenských pozic a budujte svou vojenskou kariéru
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {jobs.map((job, index) => (
            <AnimatedCard
              key={index}
              delay={index * 0.05}
              direction="scale"
              className="bg-yellow-darkest/70 border-yellow-dark/50 hover:border-primary/70 backdrop-blur-sm"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/30 transition-colors duration-300">
                  <job.icon
                    className={`h-8 w-8 ${job.color} group-hover:text-primary transition-colors duration-300`}
                  />
                </div>
                <h3 className="text-xl font-serif font-bold text-yellow-light mb-3">{job.title}</h3>
                <p className="text-yellow-light/70 text-sm leading-relaxed">{job.description}</p>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
