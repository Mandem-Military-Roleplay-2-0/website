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
  global_name: string | null;
}

interface DiscordMember {
  user: DiscordUser;
  nick: string | null;
  roles: string[];
  global_name: string | null;
}

interface RoleConfig {
  category: 'leadership' | 'management' | 'technical' | 'administration' | 'staff';
  title: string;
  description: string;
  icon: 'Crown' | 'Shield' | 'Users' | 'Wrench';
  priority: number;
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

interface CachedTeamData {
  members: TeamMember[];
  categories: {
    leadership: TeamMember[];
    management: TeamMember[];
    technical: TeamMember[];
    administration: TeamMember[];
    staff: TeamMember[];
  };
  totalCount: number;
  lastUpdate: number;
  lastCheck: number;
  memberHash: string; // Hash pro rychlou detekci změn
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

// Configuration
const CONFIG = {
  CACHE_TTL: 5 * 60 * 1000, // 5 minut pro kompletní cache
  QUICK_CHECK_TTL: 30 * 1000, // 30 sekund pro rychlou kontrolu
  REQUEST_TIMEOUT: 8000,
  MAX_MEMBERS: 1000,
};

// Mapování rolí na kategorie a ikony
const roleMapping: Record<string, RoleConfig> = {
  "1407360962281082971": { // Owner
    category: "leadership",
    title: "Zakladatel & Majitel",
    description: "Opice co to platí",
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
    title: "Authority",
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
    description: "Vývojář scriptů a technických řešení pro server.",
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

// Global cache
let teamCache: CachedTeamData | null = null;
let processingLock = false;

// Utility functions
function fetchWithTimeout(url: string, options: any, timeout = CONFIG.REQUEST_TIMEOUT) {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

function hexToRgb(hex: string): RgbColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getContrastColor(hexColor: string): string {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return "#ffffff";
  
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

// Vytvoří hash z member dat pro rychlou detekci změn
function createMemberHash(members: DiscordMember[]): string {
  const targetRoles = Object.keys(roleMapping);
  const relevantMembers = members
    .filter(member => member.roles.some(roleId => targetRoles.includes(roleId)))
    .map(member => ({
      id: member.user.id,
      name: member.user.global_name || member.user.username,
      roles: member.roles.filter(roleId => targetRoles.includes(roleId)).sort()
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return Buffer.from(JSON.stringify(relevantMembers)).toString('base64').slice(0, 16);
}

// Rychlá kontrola změn bez načítání všech dat
async function quickMemberCheck(guildId: string, botToken: string): Promise<string | null> {
  try {
    // Získáme pouze IDs a role pro rychlou kontrolu
    const membersRes = await fetchWithTimeout(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=${CONFIG.MAX_MEMBERS}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
          'User-Agent': 'DiscordBot (MandemMilitary, 1.0)',
        },
      },
      5000 // Kratší timeout pro rychlou kontrolu
    );

    if (!membersRes.ok) {
      console.warn('Quick member check failed, will use cache');
      return null;
    }

    const members: DiscordMember[] = await membersRes.json();
    return createMemberHash(members);
  } catch (error) {
    console.warn('Quick member check failed:', error);
    return null;
  }
}

// Zpracování kompletních team dat
async function processTeamData(guildId: string, botToken: string): Promise<CachedTeamData> {
  console.log('Processing team data...');

  // Paralelní načtení rolí a členů
  const [rolesRes, membersRes] = await Promise.allSettled([
    fetchWithTimeout(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    }),
    fetchWithTimeout(`https://discord.com/api/v10/guilds/${guildId}/members?limit=${CONFIG.MAX_MEMBERS}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
        'User-Agent': 'DiscordBot (MandemMilitary, 1.0)',
      },
    })
  ]);

  // Zpracování rolí
  let roleColors: Record<string, number> = {};
  if (rolesRes.status === 'fulfilled' && rolesRes.value.ok) {
    const roles: DiscordRole[] = await rolesRes.value.json();
    roleColors = roles.reduce((acc, role) => {
      acc[role.id] = role.color;
      return acc;
    }, {} as Record<string, number>);
  }

  // Zpracování členů
  if (membersRes.status !== 'fulfilled' || !membersRes.value.ok) {
    throw new Error('Failed to fetch members');
  }

  const members: DiscordMember[] = await membersRes.value.json();
  console.log(`Processing ${members.length} members`);

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
        name: member.user.global_name || member.user.username,
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

  const categories = {
    leadership: teamMembers.filter(m => m.category === 'leadership'),
    management: teamMembers.filter(m => m.category === 'management'), 
    technical: teamMembers.filter(m => m.category === 'technical'),
    administration: teamMembers.filter(m => m.category === 'administration'),
    staff: teamMembers.filter(m => m.category === 'staff')
  };

  const now = Date.now();
  const memberHash = createMemberHash(members);

  console.log(`Processed ${teamMembers.length} team members`);

  return {
    members: teamMembers,
    categories,
    totalCount: teamMembers.length,
    lastUpdate: now,
    lastCheck: now,
    memberHash
  };
}

// Hlavní funkce pro získání team dat
async function getTeamData(forceUpdate: boolean = false): Promise<CachedTeamData> {
  // Prevence současného zpracování
  if (processingLock && !forceUpdate) {
    console.log('Team processing in progress, returning cached data');
    if (teamCache) {
      return teamCache;
    }
  }

  const now = Date.now();
  
  // Použij cache pokud je aktuální
  if (teamCache && !forceUpdate && (now - teamCache.lastUpdate) < CONFIG.CACHE_TTL) {
    console.log('Using cached team data');
    return teamCache;
  }

  const { DISCORD_GUILD_ID: guildId, DISCORD_BOT_TOKEN: botToken } = process.env;
  if (!guildId || !botToken) {
    throw new Error("Missing environment variables");
  }

  // Rychlá kontrola změn pokud máme cache
  if (teamCache && !forceUpdate && (now - teamCache.lastCheck) < CONFIG.QUICK_CHECK_TTL) {
    console.log('Quick check not needed yet, using cache');
    return teamCache;
  }

  console.log('Checking for team changes...');
  
  try {
    const currentHash = await quickMemberCheck(guildId, botToken);
    
    // Aktualizuj čas kontroly
    if (teamCache) {
      teamCache.lastCheck = now;
    }

    // Pokud se hash nezměnil, vrať cache
    if (teamCache && currentHash && currentHash === teamCache.memberHash && !forceUpdate) {
      console.log('No team changes detected, using cache');
      return teamCache;
    }

    console.log('Team changes detected or forced update, processing...');
    processingLock = true;

    // Zpracuj kompletní data
    const newTeamData = await processTeamData(guildId, botToken);
    
    // Uložit do cache
    teamCache = newTeamData;
    
    return newTeamData;

  } catch (error) {
    console.error('Team processing failed:', error);
    
    // Vrať cache při chybě
    if (teamCache) {
      console.log('Returning cached data due to error');
      return teamCache;
    }
    
    throw error;
  } finally {
    processingLock = false;
  }
}

export async function GET(request: Request) {
  const startTime = Date.now();
  
  try {
    console.log('Starting team request...');
    
    // Check for force update parameter
    const url = new URL(request.url);
    const forceUpdate = url.searchParams.get('force') === 'true';
    
    const teamData = await getTeamData(forceUpdate);
    
    const duration = Date.now() - startTime;
    console.log(`Team request completed in ${duration}ms`);

    return NextResponse.json({
      ...teamData,
      fromCache: !forceUpdate && teamCache !== null,
      stats: {
        duration,
        cached: teamCache !== null,
        lastUpdate: teamData.lastUpdate
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Team request failed after ${duration}ms:`, error);
    
    return NextResponse.json({ 
      error: "Failed to fetch team data", 
      details: error instanceof Error ? error.message : "Unknown error",
      members: [],
      categories: {
        leadership: [],
        management: [],
        technical: [],
        administration: [],
        staff: []
      },
      totalCount: 0
    }, { status: 500 });
  }
}

// Webhook pro invalidaci cache (volitelné)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Clear cache on member updates
    if (
      body.t === 'GUILD_MEMBER_UPDATE' || 
      body.t === 'GUILD_MEMBER_ADD' || 
      body.t === 'GUILD_MEMBER_REMOVE'
    ) {
      console.log('Member change detected, clearing team cache');
      teamCache = null;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Team webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}