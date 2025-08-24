import { NextResponse } from "next/server";
import { put, del, head } from '@vercel/blob';

export const runtime = "nodejs";

// Interfaces
interface DiscordMessage {
  id: string;
  channel_id: string;
  content: string;
  author: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
    global_name: string | null;
  };
  attachments: DiscordAttachment[];
  timestamp: string;
}

interface DiscordAttachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxy_url: string;
  width?: number;
  height?: number;
  content_type?: string;
}

interface GalleryImage {
  id: string;
  messageId: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  timestamp: string;
  filename: string;
  width?: number;
  height?: number;
}

interface CachedGalleryData {
  images: GalleryImage[];
  lastUpdate: number;
  lastDiscordCheck: number;
  messageIds: string[];
}

// Configuration
const CONFIG = {
  APPROVED_ROLES: [
    "1407360962281082971", // Owner
    "1407360658542035009", // Management  
    "1407360658542035008", // Authority
    "1407375299133313127"  // Community Management
  ],
  GALLERY_CHANNEL_ID: "1407360658952945698",
  CROWN_EMOJI: "👑",
  CACHE_TTL: 2 * 60 * 1000, // 2 minuty pro data
  DISCORD_CHECK_TTL: 30 * 1000, // 30 sekund pro kontrolu Discord zpráv
  ROLE_CACHE_TTL: 15 * 60 * 1000, // 15 minut pro role
  MAX_CONCURRENT: 3,
  REQUEST_TIMEOUT: 8000,
};

// Global cache - nyní obsahuje více informací
let galleryCache: CachedGalleryData | null = null;
const roleCache = new Map<string, { hasRole: boolean; timestamp: number }>();

// Lock pro prevenci současného zpracování
let processingLock = false;

// Utility: Create fetch with timeout
function fetchWithTimeout(url: string, options: any, timeout = CONFIG.REQUEST_TIMEOUT) {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeout)
    )
  ]);
}

// Fast role check with aggressive caching
async function hasApprovedRole(userId: string, guildId: string, botToken: string): Promise<boolean> {
  const cacheKey = `${userId}_${guildId}`;
  const cached = roleCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CONFIG.ROLE_CACHE_TTL) {
    return cached.hasRole;
  }

  try {
    const response = await fetchWithTimeout(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      }
    );

    if (!response.ok) {
      roleCache.set(cacheKey, { hasRole: false, timestamp: Date.now() });
      return false;
    }

    const member = await response.json();
    const hasRole = member.roles.some((roleId: string) => 
      CONFIG.APPROVED_ROLES.includes(roleId)
    );
    
    roleCache.set(cacheKey, { hasRole, timestamp: Date.now() });
    return hasRole;
  } catch (error) {
    console.error(`Role check failed for ${userId}:`, error);
    roleCache.set(cacheKey, { hasRole: false, timestamp: Date.now() });
    return false;
  }
}

// Get crown reaction users
async function getCrownUsers(messageId: string, botToken: string): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(
      `https://discord.com/api/v10/channels/${CONFIG.GALLERY_CHANNEL_ID}/messages/${messageId}/reactions/${encodeURIComponent(CONFIG.CROWN_EMOJI)}`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
      5000 // Kratší timeout pro reakce
    );

    if (!response.ok) return [];
    
    const users = await response.json();
    return users.map((user: any) => user.id);
  } catch (error) {
    // Tichý failure - reakce nejsou kritické
    return [];
  }
}

// Generate title from content
function generateTitle(content: string, filename: string): string {
  const clean = content
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/<@[!&]?\d+>/g, '')
    .replace(/<#\d+>/g, '')
    .replace(/:\w+:/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return (clean && clean.length <= 100) ? clean : filename.split('.')[0] || 'Bez názvu';
}

// Download image with retry
async function downloadImage(url: string, filename: string): Promise<string> {
  try {
    const response = await fetchWithTimeout(url, {}, 15000); // Delší timeout pro download
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const blob = await put(sanitized, buffer, { access: 'public' });
    return blob.url;
  } catch (error) {
    console.error(`Download failed for ${filename}:`, error);
    throw error;
  }
}

// Load gallery data from blob storage
async function loadGalleryDataFromStorage(): Promise<CachedGalleryData> {
  try {
    const blob = await head("gallery.json").catch(() => null);
    if (!blob) {
      return {
        images: [],
        lastUpdate: 0,
        lastDiscordCheck: 0,
        messageIds: []
      };
    }

    const response = await fetchWithTimeout(blob.url, {}, 5000);
    if (!response.ok) throw new Error('Failed to fetch gallery data');
    
    const data = await response.json();
    
    // Backwards compatibility - pokud je stará struktura
    if (Array.isArray(data)) {
      return {
        images: data,
        lastUpdate: Date.now(),
        lastDiscordCheck: 0,
        messageIds: data.map((img: GalleryImage) => img.messageId)
      };
    }
    
    return data;
  } catch (error) {
    console.error("Failed to load gallery data:", error);
    return {
      images: [],
      lastUpdate: 0,
      lastDiscordCheck: 0,
      messageIds: []
    };
  }
}

// Save gallery data with enhanced structure
async function saveGalleryData(cacheData: CachedGalleryData): Promise<void> {
  try {
    await put("gallery.json", JSON.stringify(cacheData), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    
    // Update in-memory cache
    galleryCache = { ...cacheData };
    console.log(`Saved ${cacheData.images.length} images to storage`);
  } catch (error) {
    console.error("Failed to save gallery data:", error);
    throw error;
  }
}

// Delete blob with error handling
async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch (error) {
    console.error(`Failed to delete blob ${url}:`, error);
  }
}

// Zkontroluj jestli se změnily zprávy v Discordu
async function checkDiscordMessages(botToken: string): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(
      `https://discord.com/api/v10/channels/${CONFIG.GALLERY_CHANNEL_ID}/messages?limit=50`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      },
      5000 // Krátký timeout pro rychlou kontrolu
    );

    if (!response.ok) {
      throw new Error(`Discord API error: ${response.status}`);
    }

    const messages: DiscordMessage[] = await response.json();
    return messages.map(m => m.id);
  } catch (error) {
    console.error("Failed to check Discord messages:", error);
    return [];
  }
}

// Hlavní funkce pro zpracování galerie
async function processGalleryUpdate(
  forceUpdate: boolean = false
): Promise<{ images: GalleryImage[]; totalCount: number; fromCache: boolean; stats?: any }> {
  
  // Prevence současného zpracování
  if (processingLock && !forceUpdate) {
    console.log('Processing already in progress, returning cached data');
    if (galleryCache) {
      return {
        images: galleryCache.images,
        totalCount: galleryCache.images.length,
        fromCache: true
      };
    }
  }

  const startTime = Date.now();
  let cacheData = galleryCache;

  try {
    // Load from storage if not in memory
    if (!cacheData) {
      console.log('Loading gallery data from storage...');
      cacheData = await loadGalleryDataFromStorage();
      galleryCache = cacheData;
    }

    const now = Date.now();
    
    // Zkontroluj jestli potřebujeme vůbec kontrolovat Discord
    const needsDiscordCheck = 
      forceUpdate || 
      !cacheData.lastDiscordCheck || 
      (now - cacheData.lastDiscordCheck) > CONFIG.DISCORD_CHECK_TTL;

    if (!needsDiscordCheck) {
      console.log('Using cached data, no Discord check needed');
      return {
        images: cacheData.images,
        totalCount: cacheData.images.length,
        fromCache: true
      };
    }

    const { DISCORD_GUILD_ID: guildId, DISCORD_BOT_TOKEN: botToken } = process.env;
    if (!guildId || !botToken) {
      throw new Error("Missing environment variables");
    }

    console.log('Checking for Discord message changes...');
    
    // Rychlá kontrola jestli se změnily zprávy
    const currentMessageIds = await checkDiscordMessages(botToken);
    const existingMessageIds = new Set(cacheData.messageIds);
    const newMessageIds = new Set(currentMessageIds);
    
    // Porovnej zprávy
    const hasChanges = 
      currentMessageIds.length !== cacheData.messageIds.length ||
      currentMessageIds.some(id => !existingMessageIds.has(id)) ||
      cacheData.messageIds.some(id => !newMessageIds.has(id));

    // Update lastDiscordCheck
    cacheData.lastDiscordCheck = now;

    if (!hasChanges && !forceUpdate) {
      console.log('No message changes detected, using cache');
      // Save updated check time
      await saveGalleryData(cacheData);
      
      return {
        images: cacheData.images,
        totalCount: cacheData.images.length,
        fromCache: true,
        stats: { duration: Date.now() - startTime }
      };
    }

    console.log('Message changes detected, processing updates...');
    processingLock = true;

    // Získej kompletní zprávy pouze pokud jsou změny
    const messagesResponse = await fetchWithTimeout(
      `https://discord.com/api/v10/channels/${CONFIG.GALLERY_CHANNEL_ID}/messages?limit=100`,
      {
        headers: { Authorization: `Bot ${botToken}` },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error("Failed to fetch detailed messages");
    }

    const messages: DiscordMessage[] = await messagesResponse.json();
    const messagesWithImages = messages.filter(m => 
      m.attachments.some(a => a.content_type?.startsWith('image/'))
    );

    console.log(`Processing ${messagesWithImages.length} messages with images`);

    // Zpracuj zprávy paralelně ale s limitem
    const messagePromises = messagesWithImages.map(async (message) => {
      try {
        const crownUsers = await getCrownUsers(message.id, botToken);
        
        // Zkontroluj role pro všechny crown users
        let hasApproval = false;
        for (const userId of crownUsers) {
          if (await hasApprovedRole(userId, guildId, botToken)) {
            hasApproval = true;
            break;
          }
        }

        if (!hasApproval) return null;

        return {
          message,
          attachments: message.attachments.filter(a => a.content_type?.startsWith('image/'))
        };
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
        return null;
      }
    });

    // Process in smaller batches
    const approvedMessages = [];
    for (let i = 0; i < messagePromises.length; i += CONFIG.MAX_CONCURRENT) {
      const batch = messagePromises.slice(i, i + CONFIG.MAX_CONCURRENT);
      const results = await Promise.allSettled(batch);
      const successful = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);
      approvedMessages.push(...successful);
    }

    console.log(`Found ${approvedMessages.length} approved messages`);

    // Determine what to keep and what to add/remove
    const currentMessages = new Set(messages.map(m => m.id));
    const approvedMessageIds = new Set(approvedMessages.map(m => m.message.id));
    
    const imagesToKeep = cacheData.images.filter(img => 
      currentMessages.has(img.messageId) && approvedMessageIds.has(img.messageId)
    );

    const imagesToRemove = cacheData.images.filter(img => 
      !currentMessages.has(img.messageId) || !approvedMessageIds.has(img.messageId)
    );

    const existingImageMessageIds = new Set(imagesToKeep.map(img => img.messageId));
    const newMessages = approvedMessages.filter(m => !existingImageMessageIds.has(m.message.id));

    console.log(`Keeping: ${imagesToKeep.length}, Removing: ${imagesToRemove.length}, New: ${newMessages.length}`);

    // Remove old blobs
    if (imagesToRemove.length > 0) {
      const deletePromises = imagesToRemove.map(img => deleteBlob(img.src));
      await Promise.allSettled(deletePromises);
    }

    // Process new messages
    const newImages: GalleryImage[] = [];
    
    for (const { message, attachments } of newMessages) {
      const attachmentPromises = attachments.map(async (attachment) => {
        try {
          const timestamp = Date.now();
          const extension = attachment.filename.split('.').pop() || 'jpg';
          const uniqueFilename = `${timestamp}_${message.id}_${attachment.id}.${extension}`;

          const blobUrl = await downloadImage(attachment.url, uniqueFilename);
          const title = generateTitle(message.content, attachment.filename);

          return {
            id: `${message.id}_${attachment.id}`,
            messageId: message.id,
            src: blobUrl,
            alt: `Fotka od ${message.author.global_name || message.author.username}`,
            title,
            author: message.author.global_name || message.author.username,
            timestamp: message.timestamp,
            filename: attachment.filename,
            width: attachment.width,
            height: attachment.height
          };
        } catch (error) {
          console.error(`Failed to process attachment ${attachment.id}:`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(attachmentPromises);
      const successful = results
        .filter((r): r is PromiseFulfilledResult<GalleryImage> => 
          r.status === 'fulfilled' && r.value !== null
        )
        .map(r => r.value);

      newImages.push(...successful);
    }

    // Combine and sort results
    const finalImages = [...imagesToKeep, ...newImages]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Update cache structure
    const updatedCacheData: CachedGalleryData = {
      images: finalImages,
      lastUpdate: now,
      lastDiscordCheck: now,
      messageIds: currentMessageIds
    };

    // Save to storage
    await saveGalleryData(updatedCacheData);

    const duration = Date.now() - startTime;
    console.log(`Gallery update completed in ${duration}ms`);

    return {
      images: finalImages,
      totalCount: finalImages.length,
      fromCache: false,
      stats: {
        removed: imagesToRemove.length,
        added: newImages.length,
        kept: imagesToKeep.length,
        duration
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Gallery update failed after ${duration}ms:`, error);
    
    // Return cached data on error
    const fallbackData = cacheData || { images: [], lastUpdate: 0, lastDiscordCheck: 0, messageIds: [] };
    return { 
      images: fallbackData.images,
      totalCount: fallbackData.images.length,
      fromCache: true
    };
  } finally {
    processingLock = false;
  }
}

export async function GET(request: Request) {
  console.log('Starting gallery request...');
  
  // Check for force update parameter
  const url = new URL(request.url);
  const forceUpdate = url.searchParams.get('force') === 'true';
  
  const result = await processGalleryUpdate(forceUpdate);
  
  return NextResponse.json({
    ...result,
    timestamp: Date.now()
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Clear cache on specific webhook events
    if (
      (body.t === 'MESSAGE_REACTION_ADD' || body.t === 'MESSAGE_REACTION_REMOVE') &&
      body.d?.channel_id === CONFIG.GALLERY_CHANNEL_ID &&
      body.d?.emoji?.name === CONFIG.CROWN_EMOJI
    ) {
      console.log('Crown reaction changed - invalidating cache');
      galleryCache = null;
      roleCache.clear();
      
      // Trigger update in background
      processGalleryUpdate(true).catch(console.error);
    }

    if (body.t === 'MESSAGE_DELETE' && body.d?.channel_id === CONFIG.GALLERY_CHANNEL_ID) {
      console.log('Message deleted - invalidating cache');
      galleryCache = null;
      
      // Trigger update in background
      processGalleryUpdate(true).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}