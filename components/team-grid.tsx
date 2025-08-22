"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Shield, Users, Wrench, Loader2, AlertCircle } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  username: string
  avatar: string
  role: string
  description: string
  category: string
  icon: string
  priority: number
  badge: string
  badgeColor: string
  textColor: string
  roleId: string
}

interface TeamResponse {
  members: TeamMember[]
  totalCount: number
  categories: {
    leadership: TeamMember[]
    management: TeamMember[]
    technical: TeamMember[]
    administration: TeamMember[]
    staff: TeamMember[]
  }
}

// Mapování ikon ze stringu na komponenty
const iconMap = {
  Crown: Crown,
  Shield: Shield,
  Users: Users,
  Wrench: Wrench,
}

export function TeamGrid() {
  const [teamData, setTeamData] = useState<TeamResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const response = await fetch('/api/team')
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch team data')
        }

        const data: TeamResponse = await response.json()
        setTeamData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        console.error('Error fetching team data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Načítání týmu...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <span className="ml-2 text-destructive">Chyba při načítání: {error}</span>
      </div>
    )
  }

  if (!teamData || teamData.members.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Users className="h-8 w-8 text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Žádní členové týmu nenalezeni</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Leadership Section */}
      {teamData.categories.leadership.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-foreground">Vedení</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData.categories.leadership.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Management Section */}
      {teamData.categories.management.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-foreground">Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData.categories.management.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Technical Section */}
      {teamData.categories.technical.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-foreground">Technický tým</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData.categories.technical.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Administration Section */}
      {teamData.categories.administration.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-foreground">Administrace</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData.categories.administration.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Staff Section */}
      {teamData.categories.staff.length > 0 && (
        <div>
          <h3 className="text-xl font-bold mb-4 text-foreground">Staff</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamData.categories.staff.map((member) => (
              <TeamMemberCard key={member.id} member={member} />
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="text-center text-sm text-muted-foreground">
        Celkem {teamData.totalCount} členů týmu
      </div>
    </div>
  )
}

function TeamMemberCard({ member }: { member: TeamMember }) {
  const IconComponent = iconMap[member.icon as keyof typeof iconMap] || Users

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`;
              }}
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors duration-300">
              <IconComponent className="h-3 w-3 text-primary" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-serif font-bold text-foreground text-lg truncate">
              {member.name}
            </h3>
            <Badge 
              className="text-xs font-medium"
              style={{ 
                backgroundColor: member.badgeColor,
                color: member.textColor,
                border: 'none'
              }}
            >
              {member.badge}
            </Badge>
          </div>
        </div>

        <h4 className="font-medium text-foreground mb-2">{member.role}</h4>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {member.description}
        </p>

        {/* Discord username jako malý detail */}
        <div className="mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">@{member.username}</span>
        </div>
      </CardContent>
    </Card>
  )
}