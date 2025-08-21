"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Server, Clock, Trophy, Shield, Zap } from "lucide-react"

const stats = [
  {
    icon: Users,
    title: "Online hráči",
    value: "127",
    subtitle: "z 150 slotů",
    color: "text-primary",
  },
  {
    icon: Server,
    title: "Uptime serveru",
    value: "99.9%",
    subtitle: "za posledních 30 dní",
    color: "text-green-500",
  },
  {
    icon: Clock,
    title: "Průměrný ping",
    value: "23ms",
    subtitle: "stabilní připojení",
    color: "text-blue-500",
  },
  {
    icon: Trophy,
    title: "Registrovaní hráči",
    value: "2,847",
    subtitle: "celkem v databázi",
    color: "text-yellow-500",
  },
  {
    icon: Shield,
    title: "Aktivní admini",
    value: "12",
    subtitle: "online nyní",
    color: "text-red-500",
  },
  {
    icon: Zap,
    title: "TPS serveru",
    value: "20.0",
    subtitle: "optimální výkon",
    color: "text-purple-500",
  },
]

export function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-serif font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
