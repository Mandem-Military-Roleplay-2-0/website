"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Shield, Users, Wrench } from "lucide-react"

const teamMembers = [
  {
    name: "CommanderAlpha",
    role: "Zakladatel & Hlavní Admin",
    description: "Zakladatel serveru s více než 5 lety zkušeností s FiveM servery.",
    icon: Crown,
    badge: "Zakladatel",
    badgeColor: "bg-primary text-primary-foreground",
  },
  {
    name: "SergeantBravo",
    role: "Head Administrator",
    description: "Hlavní administrátor zodpovědný za chod serveru a dodržování pravidel.",
    icon: Shield,
    badge: "Admin",
    badgeColor: "bg-red-500 text-white",
  },
  {
    name: "CorporalCharlie",
    role: "Community Manager",
    description: "Stará se o komunitu, eventy a komunikaci s hráči.",
    icon: Users,
    badge: "Manager",
    badgeColor: "bg-blue-500 text-white",
  },
  {
    name: "TechDelta",
    role: "Developer",
    description: "Vývojář vlastních scriptů a technických řešení pro server.",
    icon: Wrench,
    badge: "Developer",
    badgeColor: "bg-green-500 text-white",
  },
  {
    name: "ModeratorEcho",
    role: "Moderátor",
    description: "Moderátor serveru a Discord komunity.",
    icon: Shield,
    badge: "Moderátor",
    badgeColor: "bg-yellow-500 text-black",
  },
  {
    name: "SupportFoxtrot",
    role: "Support Team",
    description: "Člen support týmu pomáhající novým hráčům.",
    icon: Users,
    badge: "Support",
    badgeColor: "bg-purple-500 text-white",
  },
]

export function TeamGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {teamMembers.map((member, index) => (
        <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors duration-300">
                <member.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-foreground text-lg">{member.name}</h3>
                <Badge className={`${member.badgeColor} text-xs`}>{member.badge}</Badge>
              </div>
            </div>

            <h4 className="font-medium text-foreground mb-2">{member.role}</h4>

            <p className="text-muted-foreground text-sm leading-relaxed">{member.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
