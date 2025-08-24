import { NextResponse } from "next/server";
import { put, del, head, list } from '@vercel/blob';

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
  lastBlobCheck: number; // Nové - kdy jsme naposledy kontrolovali blob storage
  messageIds: string[];
  version: string;
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
  CACHE_TTL: 2 * 60 * 1000, // 2 minuty
  DISCORD_CHECK_TTL: 30 * 1000, // 30 sekund
  BLOB_CHECK_TTL: 5 * 60 * 1000, // 5 minut - kontrola existence blob-ů
  ROLE_CACHE_TTL: 15 * 60 * 1000, // 15 minut
  MAX_CONCURRENT: 2,
  REQUEST_TIMEOUT: 10000,
  CACHE_VERSION: "v1.2"
};

// Globální cache
let galleryCache: CachedGalleryData | null = null;
const roleCache = new Map<string, { hasRole: boolean; timestamp: number }>();

// Processing state
const processingState = {
  isProcessing: false,
  startTime: 0,
  maxDuration: 60000 // 60 sekund timeout
};

// Utility: Bezpečný fetch s timeout
async function safeFetch(url: string, options: RequestInit = {}, timeout = CONFIG.REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Kontrola existence blob-u
async function blobExists(url: string): Promise<boolean> {
  try {
    const response = await safeFetch(url, { method: 'HEAD' }, 5000);
    return response.ok;
  } catch (error) {
    console.warn(`Blob check failed for ${url}:`, error);
    return false;
  }
}

// Validace a oprava blob storage
async function validateAndFixBlobs(images: GalleryImage[], botToken: string): Promise<GalleryImage[]> {
  console.log('Validating blob storage...');
  const validImages: GalleryImage[] = [];
  const invalidImages: GalleryImage[] = [];

  // Kontrola existence všech blob-ů paralelně (v malých batch-ích)
  const batchSize = 5;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    
    const validationPromises = batch.map(async (image) => {
      const exists = await blobExists(image.src);
      return { image, exists };
    });

    const results = await Promise.allSettled(validationPromises);
    
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.exists) {
          validImages.push(result.value.image);
        } else {
          console.warn(`Blob missing for image ${result.value.image.id}: ${result.value.image.src}`);
          invalidImages.push(result.value.image);
        }
      } else {
        console.error('Validation failed:', result.reason);
      }
    });
  }

  console.log(`Blob validation: ${validImages.length} valid, ${invalidImages.length} invalid`);

  // Pokud jsou nějaké nevalidní obrázky, pokus se je re-uploadnout
  if (invalidImages.length > 0) {
    console.log(`Attempting to re-upload ${invalidImages.length} missing images...`);
    
    for (const image of invalidImages) {
      try {
        // Pokus se získat původní URL z Discordu
        const messageResponse = await safeFetch(
          `https://discord.com/api/v10/channels/${CONFIG.GALLERY_CHANNEL_ID}/messages/${image.messageId}`,
          { headers: { Authorization: `Bot ${botToken}` } }
        );

        if (!messageResponse.ok) {
          console.error(`Cannot fetch message ${image.messageId} for re-upload`);
          continue;
        }

        const message: DiscordMessage = await messageResponse.json();
        const attachment = message.attachments.find(a => 
          image.filename === a.filename || 
          image.id.includes(a.id)
        );

        if (!attachment) {
          console.error(`Cannot find attachment for image ${image.id}`);
          continue;
        }

        // Re-upload obrázek
        const newBlobUrl = await downloadImageSafely(attachment.url, attachment.filename);
        
        // Updatuj URL v objektu
        const repairedImage = { ...image, src: newBlobUrl };
        validImages.push(repairedImage);
        
        console.log(`Successfully re-uploaded image ${image.id}`);
        
        // Krátká pauza mezi re-upload-y
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Failed to re-upload image ${image.id}:`, error);
        // Nechej nevalidní obrázek mimo finální seznam
      }
    }
  }

  return validImages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Vyčisti orphaned blob-y (blob-y bez odpovídající image v cache)
async function cleanupOrphanedBlobs(validImages: GalleryImage[]): Promise<void> {
  try {
    console.log('Checking for orphaned blobs...');
    const { blobs } = await list({ limit: 1000 });
    
    const validUrls = new Set(validImages.map(img => img.src));
    const orphanedBlobs = blobs.filter(blob => 
      blob.pathname !== 'gallery.json' && // Nemaž cache soubor
      !validUrls.has(blob.url)
    );

    if (orphanedBlobs.length > 0) {
      console.log(`Found ${orphanedBlobs.length} orphaned blobs, cleaning up...`);
      
      const deletePromises = orphanedBlobs.map(blob => 
        deleteBlobSafely(blob.url)
      );
      
      await Promise.allSettled(deletePromises);
      console.log('Orphaned blobs cleanup completed');
    } else {
      console.log('No orphaned blobs found');
    }
  } catch (error) {
    console.error('Failed to cleanup orphaned blobs:', error);
  }
}

// Kontrola a reset processing lock
function checkAndResetProcessingLock(): boolean {
  const now = Date.now();
  
  if (processingState.isProcessing && (now - processingState.startTime) > processingState.maxDuration) {
    console.warn('Processing lock timeout - resetting');
    processingState.isProcessing = false;
    processingState.startTime = 0;
  }
  
  return processingState.isProcessing;
}

// Optimalizovaná kontrola rolí
async function hasApprovedRole(userId: string, guildId: string, botToken: string): Promise<boolean> {
  const cacheKey = `${userId}_${guildId}`;
  const cached = roleCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CONFIG.ROLE_CACHE_TTL) {
    return cached.hasRole;
  }

  try {
    const response = await safeFetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      { headers: { Authorization: `Bot ${botToken}` } },
      5000
    );

    if (!response.ok) {
      if (response.status === 404) {
        roleCache.set(cacheKey, { hasRole: false, timestamp: Date.now() });
        return false;
      }
      if (response.status === 429) {
        return cached ? cached.hasRole : false;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const member = await response.json();
    const hasRole = Array.isArray(member.roles) && 
      member.roles.some((roleId: string) => CONFIG.APPROVED_ROLES.includes(roleId));
    
    roleCache.set(cacheKey, { hasRole, timestamp: Date.now() });
    return hasRole;
  } catch (error) {
    console.error(`Role check failed for ${userId}:`, error);
    return cached ? cached.hasRole : false;
  }
}

// Získání crown reactions
async function getCrownUsers(messageId: string, botToken: string): Promise<string[]> {
  try {
    const response = await safeFetch(
      `https://discord.com/api/v10/channels/${CONFIG.GALLERY_CHANNEL_ID}/messages/${messageId}/reactions/${encodeURIComponent(CONFIG.CROWN_EMOJI)}`,
      { headers: { Authorization: `Bot ${botToken}` } },
      5000
    );

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`HTTP ${response.status}`);
    }
    
    const users = await response.json();
    return Array.isArray(users) ? users.map((user: any) => user.id).filter(Boolean) : [];
  } catch (error) {
    console.warn(`Failed to get crown users for message ${messageId}:`, error);
    return [];
  }
}

// Generování názvu
function generateTitle(content: string, filename: string): string {
  if (!content || typeof content !== 'string') {
    return filename ? filename.split('.')[0] || 'Bez názvu' : 'Bez názvu';
  }

  const clean = content
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/<@[!&]?\d+>/g, '')
    .replace(/<#\d+>/g, '')
    .replace(/:\w+:/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean && clean.length > 0 && clean.length <= 100) {
    return clean;
  }

  return filename ? filename.split('.')[0] || 'Bez názvu' : 'Bez názvu';
}

// Bezpečný download s retry logikou
async function downloadImageSafely(url: string, filename: string, maxRetries = 2): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Downloading ${filename} (attempt ${attempt}/${maxRetries})`);
      
      const response = await safeFetch(url, {}, 20000);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      const buffer = await response.arrayBuffer();
      if (buffer.byteLength === 0) {
        throw new Error('Empty file received');
      }

      // Sanitizace filename s timestamp
      const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const uniqueFilename = `gallery_${timestamp}_${randomSuffix}_${sanitized}`;
      
      const blob = await put(uniqueFilename, buffer, { 
        access: 'public',
        contentType: contentType || 'image/jpeg',
        addRandomSuffix: false, // Už máme vlastní suffix
        allowOverwrite: true
      });
      
      console.log(`Successfully uploaded ${filename} as ${uniqueFilename}`);
      
      // Hned zkontroluj že blob existuje
      const exists = await blobExists(blob.url);
      if (!exists) {
        throw new Error('Blob was not created successfully');
      }
      
      return blob.url;
    } catch (error) {
      lastError = error as Error;
      console.error(`Download attempt ${attempt} failed for ${filename}:`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('Download failed after all retries');
}

// Načtení dat ze storage
async function loadGalleryDataFromStorage(): Promise<CachedGalleryData> {
  try {
    const blob = await head("gallery.json").catch(() => null);
    if (!blob) {
      return {
        images: [],
        lastUpdate: 0,
        lastDiscordCheck: 0,
        lastBlobCheck: 0,
        messageIds: [],
        version: CONFIG.CACHE_VERSION
      };
    }

    const response = await safeFetch(blob.url, {}, 8000);
    if (!response.ok) {
      throw new Error(`Failed to fetch gallery data: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Backwards compatibility
    if (Array.isArray(data)) {
      return {
        images: data.filter(img => img && img.id && img.src),
        lastUpdate: Date.now(),
        lastDiscordCheck: 0,
        lastBlobCheck: 0,
        messageIds: data.map((img: GalleryImage) => img.messageId).filter(Boolean),
        version: CONFIG.CACHE_VERSION
      };
    }
    
    // Validace struktury
    const validatedData: CachedGalleryData = {
      images: Array.isArray(data.images) ? data.images.filter(img => img && img.id && img.src) : [],
      lastUpdate: typeof data.lastUpdate === 'number' ? data.lastUpdate : 0,
      lastDiscordCheck: typeof data.lastDiscordCheck === 'number' ? data.lastDiscordCheck : 0,
      lastBlobCheck: typeof data.lastBlobCheck === 'number' ? data.lastBlobCheck : 0,
      messageIds: Array.isArray(data.messageIds) ? data.messageIds.filter(Boolean) : [],
      version: data.version || CONFIG.CACHE_VERSION
    };
    
    return validatedData;
  } catch (error) {
    console.error("Failed to load gallery data from storage:", error);
    return {
      images: [],
      lastUpdate: 0,
      lastDiscordCheck: 0,
      lastBlobCheck: 0,
      messageIds: [],
      version: CONFIG.CACHE_VERSION
    };
  }
}

// Uložení do storage
async function saveGalleryDataToStorage(cacheData: CachedGalleryData): Promise<boolean> {
  try {
    const dataToSave = {
      ...cacheData,
      images: cacheData.images.filter(img => img && img.id && img.src),
      version: CONFIG.CACHE_VERSION
    };

    await put("gallery.json", JSON.stringify(dataToSave, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    
    galleryCache = { ...dataToSave };
    console.log(`Successfully saved ${dataToSave.images.length} images to storage`);
    return true;
  } catch (error) {
    console.error("Failed to save gallery data to storage:", error);
    return false;
  }
}

// Bezpečné mazání blob
async function deleteBlobSafely(url: string): Promise<void> {
  try {
    await del(url);
    console.log(`Successfully deleted blob: ${url}`);
  } catch (error) {
    console.warn(`Failed to delete blob ${url}:`, error);
  }
}

// Kontrola Discord zpráv
async function checkDiscordMessages(botToken: string): Promise<string[]> {
  try {
    const response = await safeFetch(
      `https://discord.com/api/v10/channels/${CONFIG.GALLERY_CHANNEL_ID}/messages?limit=50`,
      { headers: { Authorization: `Bot ${botToken}` } },
      8000
    );

    if (!response.ok) {
      throw new Error(`Discord API error: HTTP ${response.status}`);
    }

    const messages: DiscordMessage[] = await response.json();
    return Array.isArray(messages) ? messages.map(m => m.id).filter(Boolean) : [];
  } catch (error) {
    console.error("Failed to check Discord messages:", error);
    return [];
  }
}

// Hlavní funkce pro zpracování galerie - s blob validací
async function processGalleryUpdate(forceUpdate: boolean = false): Promise<{
  images: GalleryImage[];
  totalCount: number;
  fromCache: boolean;
  stats?: any;
  error?: string;
}> {
  const startTime = Date.now();

  // Kontrola processing lock
  if (checkAndResetProcessingLock() && !forceUpdate) {
    console.log('Processing already in progress, returning cached data');
    const cachedData = galleryCache || await loadGalleryDataFromStorage();
    return {
      images: cachedData.images,
      totalCount: cachedData.images.length,
      fromCache: true
    };
  }

  try {
    // Načti cache pokud není v paměti
    if (!galleryCache) {
      console.log('Loading gallery data from storage...');
      galleryCache = await loadGalleryDataFromStorage();
    }

    const now = Date.now();
    let cacheData = galleryCache;
    
    // Environment variables check
    const { DISCORD_GUILD_ID: guildId, DISCORD_BOT_TOKEN: botToken } = process.env;
    if (!guildId || !botToken) {
      throw new Error("Missing required environment variables: DISCORD_GUILD_ID or DISCORD_BOT_TOKEN");
    }

    // Kontrola jestli potřebujeme validovat blob-y
    const needsBlobCheck = 
      forceUpdate || 
      !cacheData.lastBlobCheck || 
      (now - cacheData.lastBlobCheck) > CONFIG.BLOB_CHECK_TTL;

    // Pokud máme obrázky a potřebujeme blob check
    if (cacheData.images.length > 0 && needsBlobCheck) {
      console.log('Validating blob storage...');
      processingState.isProcessing = true;
      processingState.startTime = now;
      
      const validatedImages = await validateAndFixBlobs(cacheData.images, botToken);
      
      // Pokud se počet změnil, něco jsme opravili/odebrali
      if (validatedImages.length !== cacheData.images.length) {
        console.log(`Blob validation changed image count: ${cacheData.images.length} -> ${validatedImages.length}`);
        cacheData = {
          ...cacheData,
          images: validatedImages,
          lastBlobCheck: now,
          lastUpdate: now
        };
        
        await saveGalleryDataToStorage(cacheData);
        processingState.isProcessing = false;
        
        return {
          images: validatedImages,
          totalCount: validatedImages.length,
          fromCache: false,
          stats: { 
            duration: Date.now() - startTime,
            blobValidation: true,
            fixed: cacheData.images.length - validatedImages.length
          }
        };
      } else {
        // Jenom updatuj timestamp
        cacheData.lastBlobCheck = now;
      }
    }

    // Kontrola jestli potřebujeme kontrolovat Discord
    const needsDiscordCheck = 
      forceUpdate || 
      !cacheData.lastDiscordCheck || 
      (now - cacheData.lastDiscordCheck) > CONFIG.DISCORD_CHECK_TTL;

    if (!needsDiscordCheck) {
      console.log('Using cached data, no Discord check needed');
      if (cacheData.lastBlobCheck !== now) {
        cacheData.lastBlobCheck = now;
        await saveGalleryDataToStorage(cacheData);
      }
      return {
        images: cacheData.images,
        totalCount: cacheData.images.length,
        fromCache: true,
        stats: { duration: Date.now() - startTime }
      };
    }

    console.log('Checking for Discord message changes...');
    
    // Set processing lock
    processingState.isProcessing = true;
    processingState.startTime = now;

    // Rychlá kontrola změn zpráv
    const currentMessageIds = await checkDiscordMessages(botToken);
    if (currentMessageIds.length === 0 && cacheData.images.length > 0) {
      console.warn('No messages received from Discord, using cached data');
      processingState.isProcessing = false;
      return {
        images: cacheData.images,
        totalCount: cacheData.images.length,
        fromCache: true,
        stats: { duration: Date.now() - startTime }
      };
    }

    const existingMessageIds = new Set(cacheData.messageIds);
    const newMessageIds = new Set(currentMessageIds);
    
    const hasChanges = 
      currentMessageIds.length !== cacheData.messageIds.length ||
      currentMessageIds.some(id => !existingMessageIds.has(id)) ||
      cacheData.messageIds.some(id => !newMessageIds.has(id));

    // Update check timestamps
    cacheData.lastDiscordCheck = now;
    cacheData.lastBlobCheck = now;

    if (!hasChanges && !forceUpdate) {
      console.log('No message changes detected, updating check times');
      await saveGalleryDataToStorage(cacheData);
      processingState.isProcessing = false;
      
      return {
        images: cacheData.images,
        totalCount: cacheData.images.length,
        fromCache: true,
        stats: { duration: Date.now() - startTime }
      };
    }

    console.log('Message changes detected, processing full update...');

    // Zbytek logiky zpracování zůstává stejný...
    const detailedResponse = await safeFetch(
      `https://discord.com/api/v10/channels/${CONFIG.GALLERY_CHANNEL_ID}/messages?limit=100`,
      { headers: { Authorization: `Bot ${botToken}` } },
      15000
    );

    if (!detailedResponse.ok) {
      throw new Error(`Failed to fetch detailed messages: HTTP ${detailedResponse.status}`);
    }

    const messages: DiscordMessage[] = await detailedResponse.json();
    const messagesWithImages = messages.filter(m => 
      m.attachments && Array.isArray(m.attachments) && 
      m.attachments.some(a => a.content_type?.startsWith('image/'))
    );

    console.log(`Processing ${messagesWithImages.length} messages with images`);

    // Zpracování zpráv v batch-ích
    const approvedMessages = [];
    const batchSize = CONFIG.MAX_CONCURRENT;

    for (let i = 0; i < messagesWithImages.length; i += batchSize) {
      const batch = messagesWithImages.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(messagesWithImages.length/batchSize)}`);
      
      const batchPromises = batch.map(async (message) => {
        try {
          const crownUsers = await getCrownUsers(message.id, botToken);
          
          if (crownUsers.length === 0) return null;
          
          let hasApproval = false;
          for (const userId of crownUsers) {
            if (await hasApprovedRole(userId, guildId, botToken)) {
              hasApproval = true;
              break;
            }
          }

          if (!hasApproval) return null;

          const imageAttachments = message.attachments.filter(a => 
            a.content_type?.startsWith('image/')
          );

          return imageAttachments.length > 0 ? {
            message,
            attachments: imageAttachments
          } : null;
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      const successful = batchResults
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);

      approvedMessages.push(...successful);

      if (i + batchSize < messagesWithImages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Found ${approvedMessages.length} approved messages`);

    // Determine what to keep, remove and add
    const currentMessages = new Set(messages.map(m => m.id));
    const approvedMessageIds = new Set(approvedMessages.map(m => m.message.id));
    
    const imagesToKeep = cacheData.images.filter(img => 
      currentMessages.has(img.messageId) && approvedMessageIds.has(img.messageId)
    );

    const imagesToRemove = cacheData.images.filter(img => 
      !currentMessages.has(img.messageId) || !approvedMessageIds.has(img.messageId)
    );

    const existingImageMessageIds = new Set(imagesToKeep.map(img => img.messageId));
    const newMessages = approvedMessages.filter(m => 
      !existingImageMessageIds.has(m.message.id)
    );

    console.log(`Keeping: ${imagesToKeep.length}, Removing: ${imagesToRemove.length}, New: ${newMessages.length}`);

    // Remove old blobs
    if (imagesToRemove.length > 0) {
      console.log('Removing old blobs...');
      const deletePromises = imagesToRemove.map(img => deleteBlobSafely(img.src));
      await Promise.allSettled(deletePromises);
    }

    // Process new images
    const newImages: GalleryImage[] = [];
    
    for (const { message, attachments } of newMessages) {
      console.log(`Processing ${attachments.length} attachments for message ${message.id}`);
      
      for (const attachment of attachments) {
        try {
          const blobUrl = await downloadImageSafely(attachment.url, attachment.filename);
          const title = generateTitle(message.content, attachment.filename);

          const newImage: GalleryImage = {
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

          newImages.push(newImage);
        } catch (error) {
          console.error(`Failed to process attachment ${attachment.id} from message ${message.id}:`, error);
        }
      }
    }

    // Final images assembly
    const finalImages = [...imagesToKeep, ...newImages]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const updatedCacheData: CachedGalleryData = {
      images: finalImages,
      lastUpdate: now,
      lastDiscordCheck: now,
      lastBlobCheck: now,
      messageIds: currentMessageIds,
      version: CONFIG.CACHE_VERSION
    };

    // Save to storage
    const saveSuccess = await saveGalleryDataToStorage(updatedCacheData);
    
    // Cleanup orphaned blobs
    if (saveSuccess) {
      await cleanupOrphanedBlobs(finalImages);
    }
    
    const duration = Date.now() - startTime;
    console.log(`Gallery update completed in ${duration}ms`);

    processingState.isProcessing = false;

    return {
      images: finalImages,
      totalCount: finalImages.length,
      fromCache: false,
      stats: {
        removed: imagesToRemove.length,
        added: newImages.length,
        kept: imagesToKeep.length,
        duration,
        saveSuccess
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Gallery update failed after ${duration}ms:`, error);
    
    processingState.isProcessing = false;
    
    const fallbackData = galleryCache || {
      images: [],
      lastUpdate: 0,
      lastDiscordCheck: 0,
      lastBlobCheck: 0,
      messageIds: [],
      version: CONFIG.CACHE_VERSION
    };
    
    return { 
      images: fallbackData.images,
      totalCount: fallbackData.images.length,
      fromCache: true,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// GET endpoint
export async function GET(request: Request) {
  console.log('=== Gallery API GET Request Started ===');
  
  try {
    const url = new URL(request.url);
    const forceUpdate = url.searchParams.get('force') === 'true';
    const validateBlobs = url.searchParams.get('validate') === 'true';
    
    if (forceUpdate) {
      console.log('Force update requested');
      // Reset cache při force update
      galleryCache = null;
      roleCache.clear();
    }

    if (validateBlobs) {
      console.log('Blob validation requested');
      // Invalidate blob check timestamp to force validation
      if (galleryCache) {
        galleryCache.lastBlobCheck = 0;
      }
    }
    
    const result = await processGalleryUpdate(forceUpdate);
    
    const response = {
      success: true,
      ...result,
      timestamp: Date.now(),
      blobStorage: {
        // Přidáme info o blob storage pro debugging
        cacheVersion: CONFIG.CACHE_VERSION,
        lastBlobCheck: galleryCache?.lastBlobCheck || 0,
        lastDiscordCheck: galleryCache?.lastDiscordCheck || 0
      }
    };

    console.log(`=== Gallery API Response: ${result.totalCount} images, fromCache: ${result.fromCache} ===`);
    
    // Přidej CORS headers pro frontend
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers
    });
    
  } catch (error) {
    console.error('Gallery API GET error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        images: [],
        totalCount: 0,
        fromCache: false,
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

// OPTIONS endpoint pro CORS
export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// POST endpoint pro webhooks
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook received:', body.t, body.d?.channel_id);
    
    // Reakce na crown emoji
    if (
      (body.t === 'MESSAGE_REACTION_ADD' || body.t === 'MESSAGE_REACTION_REMOVE') &&
      body.d?.channel_id === CONFIG.GALLERY_CHANNEL_ID &&
      body.d?.emoji?.name === CONFIG.CROWN_EMOJI
    ) {
      console.log('Crown reaction changed - invalidating cache');
      galleryCache = null;
      roleCache.clear();
      
      // Spusť update na pozadí
      processGalleryUpdate(true).catch(error => 
        console.error('Background update failed:', error)
      );
    }

    // Smazání zprávy
    if (
      body.t === 'MESSAGE_DELETE' && 
      body.d?.channel_id === CONFIG.GALLERY_CHANNEL_ID
    ) {
      console.log('Message deleted in gallery channel - invalidating cache');
      galleryCache = null;
      
      processGalleryUpdate(true).catch(error => 
        console.error('Background update failed:', error)
      );
    }

    // Nová zpráva s attachments
    if (
      body.t === 'MESSAGE_CREATE' && 
      body.d?.channel_id === CONFIG.GALLERY_CHANNEL_ID &&
      body.d?.attachments?.length > 0
    ) {
      console.log('New message with attachments - invalidating cache');
      galleryCache = null;
      
      // Krátká prodleva před update (Discord někdy potřebuje čas)
      setTimeout(() => {
        processGalleryUpdate(true).catch(error => 
          console.error('Background update failed:', error)
        );
      }, 2000);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}