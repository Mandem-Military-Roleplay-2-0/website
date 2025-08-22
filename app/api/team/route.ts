import { NextResponse } from "next/server";

export const runtime = "nodejs";

// TypeScript interfaces
interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
}

interface DiscordMember {
  user: DiscordUser;
  nick: string | null;
  roles: string[];
}

interface RoleConfig {
  category: 'leadership' | 'management' | 'technical' | 'administration' | 'staff';
  title: string;
  description: string;
  icon: 'Crown' | 'Shield' | 'Users' | 'Wrench';
  priority: number;
}

// Mapování rolí na kategorie a ikony
const roleMapping: Record<string, RoleConfig> = {
  "1407360962281082971": { // Owner
    category: "leadership",
    title: "Zakladatel & Hlavní Admin",
    description: "Zakladatel serveru s více než 5 lety zkušeností s FiveM servery.",
    icon: "Crown",
    priority: 1
  },
  "1407360658542035009": { // Management
    category: "leadership", 
    title: "Management",
    description: "Vrcholové vedení serveru zodpovědné za strategické rozhodnutí.",
    icon: "Shield",
    priority: 2
  },
  "1407360658542035008": { // Authority
    category: "leadership",
    title: "Autorita",
    description: "Vysoká pozice s rozhodovací pravomocí nad chodem serveru.",
    icon: "Shield", 
    priority: 3
  },
  "1407375299133313127": { // Community Management
    category: "management",
    title: "Community Manager", 
    description: "Stará se o komunitu, eventy a komunikaci s hráči.",
    icon: "Users",
    priority: 4
  },
  "1407445132487295176": { // Tech Management
    category: "technical",
    title: "Tech Management",
    description: "Vedoucí technického týmu zodpovědný za vývoj a údržbu.",
    icon: "Wrench",
    priority: 5
  },
  "1407445883469041887": { // Tech Staff
    category: "technical",
    title: "Tech Staff", 
    description: "Vývojář vlastních scriptů a technických řešení pro server.",
    icon: "Wrench",
    priority: 6
  },
  "1407445880704860210": { // Administrator
    category: "administration",
    title: "Administrator",
    description: "Administrátor zodpovědný za chod serveru a dodržování pravidel.",
    icon: "Shield",
    priority: 7
  },
  "1407445881212637414": { // Trial Administrator  
    category: "administration",
    title: "Trial Administrator",
    description: "Administrátor ve zkušební době s omezenými pravomocemi.",
    icon: "Shield",
    priority: 8
  },
  "1407445882009550888": { // Senior Staff
    category: "staff",
    title: "Senior Staff",
    description: "Zkušený člen týmu s rozšířenými pravomocemi.",
    icon: "Users",
    priority: 9
  },
  "1407445884073152625": { // Staff
    category: "staff", 
    title: "Staff",
    description: "Člen týmu pomáhající s moderováním a supportem.",
    icon: "Users",
    priority: 10
  },
  "1407445882932035724": { // Trial Staff
    category: "staff",
    title: "Trial Staff", 
    description: "Nový člen týmu ve zkušební době.",
    icon: "Users", 
    priority: 11
  }
};

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface TeamMember {
  id: string;
  name: string;
  username: string;
  avatar: string;
  role: string;
  description: string;
  category: string;
  icon: string;
  priority: number;
  badge: string;
  badgeColor: string;
  textColor: string;
  roleId: string;
}

function hexToRgb(hex: string): RgbColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getContrastColor(hexColor: string) {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#ffffff";
  
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

export async function GET() {
  try {
    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;

    if (!guildId || !botToken) {
      return NextResponse.json({ 
        error: "Missing environment variables" 
      }, { status: 500 });
    }

    // Načtení všech rolí pro získání barev
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!rolesRes.ok) {
      console.error("Failed to fetch roles:", await rolesRes.text());
    }

    const roles: DiscordRole[] = rolesRes.ok ? await rolesRes.json() : [];
    const roleColors: Record<string, number> = roles.reduce((acc, role) => {
      acc[role.id] = role.color;
      return acc;
    }, {} as Record<string, number>);

    // Načtení členů serveru
    const membersRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members?limit=1000`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        'User-Agent': 'DiscordBot (MandemMilitary, 1.0)',
      },
    });

    if (!membersRes.ok) {
      const errorData = await membersRes.json().catch(() => ({ message: "Unknown error" }));
      console.error("Discord API error:", errorData);
      return NextResponse.json({ 
        error: "Failed to fetch members", 
        details: errorData 
      }, { status: membersRes.status });
    }

    const members: DiscordMember[] = await membersRes.json();
    const targetRoles = Object.keys(roleMapping);
    
    // Filtrování a mapování členů s potřebnými rolemi
    const teamMembers: TeamMember[] = members
      .filter((member: DiscordMember) => 
        member.roles.some((roleId: string) => targetRoles.includes(roleId))
      )
      .map((member: DiscordMember) => {
        // Najdeme nejvyšší roli (podle priority)
        const memberRoles = member.roles.filter((roleId: string) => targetRoles.includes(roleId));
        const highestRole = memberRoles
          .map((roleId: string) => ({ roleId, ...roleMapping[roleId] }))
          .sort((a, b) => a.priority - b.priority)[0];

        const roleColor = roleColors[highestRole.roleId];
        const hexColor = roleColor ? `#${roleColor.toString(16).padStart(6, '0')}` : '#6366f1';
        const textColor = getContrastColor(hexColor);

        return {
          id: member.user.id,
          name: member.nick || member.user.username,
          username: member.user.username,
          avatar: member.user.avatar ? 
            `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}.png?size=256` : 
            `https://cdn.discordapp.com/embed/avatars/${parseInt(member.user.discriminator) % 5}.png`,
          role: highestRole.title,
          description: highestRole.description,
          category: highestRole.category,
          icon: highestRole.icon,
          priority: highestRole.priority,
          badge: highestRole.title,
          badgeColor: hexColor,
          textColor: textColor,
          roleId: highestRole.roleId
        };
      })
      .sort((a, b) => a.priority - b.priority);

    return NextResponse.json({
      members: teamMembers,
      totalCount: teamMembers.length,
      categories: {
        leadership: teamMembers.filter(m => m.category === 'leadership'),
        management: teamMembers.filter(m => m.category === 'management'), 
        technical: teamMembers.filter(m => m.category === 'technical'),
        administration: teamMembers.filter(m => m.category === 'administration'),
        staff: teamMembers.filter(m => m.category === 'staff')
      }
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}