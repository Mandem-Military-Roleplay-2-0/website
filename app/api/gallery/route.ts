import { NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';
import { put, del, head } from '@vercel/blob';

export const runtime = "nodejs";

// TypeScript interfaces
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
  reactions?: DiscordReaction[];
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

interface DiscordReaction {
  emoji: {
    id: string | null;
    name: string;
  };
  count: number;
  me: boolean;
  users?: string[];
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

// Oprávněné role pro schvalování fotek
const APPROVED_ROLES = [
  "1407360962281082971", // Owner
  "1407360658542035009", // Management
  "1407360658542035008", // Authority
  "1407375299133313127"  // Community Management
];

const GALLERY_CHANNEL_ID = "1407360658952945698";
const CROWN_EMOJI = "👑"; // :crown: emoji

// Generate title from message content or fallback to filename
function generateTitle(messageContent: string, filename: string): string {
  // Clean message content - remove URLs, mentions, and extra whitespace
  const cleanContent = messageContent
    .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
    .replace(/<@[!&]?\d+>/g, '') // Remove user/role mentions
    .replace(/<#\d+>/g, '') // Remove channel mentions
    .replace(/:\w+:/g, '') // Remove custom emojis
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  // Use cleaned content if it's not empty and reasonable length
  if (cleanContent && cleanContent.length > 0 && cleanContent.length <= 100) {
    return cleanContent;
  }

  // Fallback to filename without extension
  return filename.split('.')[0] || 'Bez názvu';
}


// Download and save image from Discord CDN
async function downloadImage(url: string, filename: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    const blob = await put(sanitizedFilename, buffer, {
      access: 'public',
    });
    
    return blob.url; // Returns full URL to blob
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}


// Check if user has approved role
async function hasApprovedRole(userId: string, guildId: string, botToken: string): Promise<boolean> {
  try {
    const memberRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!memberRes.ok) return false;

    const member = await memberRes.json();
    return member.roles.some((roleId: string) => APPROVED_ROLES.includes(roleId));
  } catch (error) {
    console.error('Error checking user roles:', error);
    return false;
  }
}

// Get users who reacted with crown emoji
async function getCrownReactionUsers(messageId: string, channelId: string, botToken: string): Promise<string[]> {
  try {
    const reactionsRes = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(CROWN_EMOJI)}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!reactionsRes.ok) return [];

    const users = await reactionsRes.json();
    return users.map((user: any) => user.id);
  } catch (error) {
    console.error('Error getting reaction users:', error);
    return [];
  }
}

async function loadGalleryData(): Promise<GalleryImage[]> {
  try {
    // nejdřív zjistíme, jestli soubor existuje
    const blob = await head("gallery.json").catch(() => null);
    if (!blob) return [];

    const res = await fetch(blob.url);
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error("Error loading gallery.json from blob:", error);
    return [];
  }
}


async function deleteImage(blobUrl: string): Promise<void> {
  try {
    // Vercel Blob URLs vypadají jako: https://xyz.public.blob.vercel-storage.com/filename
    await del(blobUrl);
    console.log(`Blob deleted: ${blobUrl}`);
  } catch (error) {
    console.error(`Error deleting blob ${blobUrl}:`, error);
  }
}

async function saveGalleryData(images: GalleryImage[]): Promise<void> {
  try {
    await put("gallery.json", JSON.stringify(images, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false, // vždy přepíše stejný soubor
    });
    console.log("Gallery data saved to blob");
  } catch (error) {
    console.error("Error saving gallery.json to blob:", error);
    throw error;
  }
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


    // Load existing gallery data
    let galleryImages = await loadGalleryData();

    // Fetch recent messages from gallery channel
    const messagesRes = await fetch(
      `https://discord.com/api/v10/channels/${GALLERY_CHANNEL_ID}/messages?limit=100`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    if (!messagesRes.ok) {
      console.error("Failed to fetch messages:", await messagesRes.text());
      return NextResponse.json({ 
        images: galleryImages,
        totalCount: galleryImages.length
      });
    }

    const messages: DiscordMessage[] = await messagesRes.json();
    let changesMade = false;

    // First, check for removed messages and remove their blobs
    const messageIds = new Set(messages.map(m => m.id));
    const imagesToRemove = galleryImages.filter(img => !messageIds.has(img.messageId));
    
    for (const imageToRemove of imagesToRemove) {
      // Delete blob (src is now blob URL)
      await deleteImage(imageToRemove.src);
      
      // Remove from gallery array
      const index = galleryImages.findIndex(img => img.id === imageToRemove.id);
      if (index > -1) {
        galleryImages.splice(index, 1);
        changesMade = true;
        console.log(`Blob removed due to deleted message: ${imageToRemove.title} by ${imageToRemove.author}`);
      }
    }

    // Process messages with image attachments
    for (const message of messages) {
      if (message.attachments.length === 0) continue;

      // Check if message already processed
      const existingImages = galleryImages.filter(img => img.messageId === message.id);
      
      // Check for crown reactions
      const crownReactionUsers = await getCrownReactionUsers(message.id, GALLERY_CHANNEL_ID, botToken);
      
      // Check if any crown reactor has approved role
      let hasApproval = false;
      for (const userId of crownReactionUsers) {
        if (await hasApprovedRole(userId, guildId, botToken)) {
          hasApproval = true;
          break;
        }
      }

      // If there are existing images but no approval anymore, remove them
      if (existingImages.length > 0 && !hasApproval) {
        for (const existingImage of existingImages) {
          // Delete blob (src is now blob URL)
          await deleteImage(existingImage.src);
          
          // Remove from gallery array
          const index = galleryImages.findIndex(img => img.id === existingImage.id);
          if (index > -1) {
            galleryImages.splice(index, 1);
            changesMade = true;
            console.log(`Blob removed due to lost approval: ${existingImage.title} by ${existingImage.author}`);
          }
        }
        continue;
      }

      // If no approval, skip adding new images
      if (!hasApproval) continue;

      // If already processed and still has approval, skip
      if (existingImages.length > 0) continue;

      // Process image attachments
      for (const attachment of message.attachments) {
        if (!attachment.content_type?.startsWith('image/')) continue;

        try {
          // Generate unique filename
          const timestamp = Date.now();
          const extension = path.extname(attachment.filename);
          const uniqueFilename = `${timestamp}_${message.id}_${attachment.id}${extension}`;

          // Download and save to Vercel Blob
          const blobUrl = await downloadImage(attachment.url, uniqueFilename);

          // Generate title from message content or filename
          const title = generateTitle(message.content, attachment.filename);

          // Create gallery entry
          const galleryEntry: GalleryImage = {
            id: `${message.id}_${attachment.id}`,
            messageId: message.id,
            src: blobUrl, // Now stores blob URL instead of local path
            alt: `Fotka od ${message.author.global_name || message.author.username}`,
            title: title,
            author: message.author.global_name || message.author.username,
            timestamp: message.timestamp,
            filename: attachment.filename,
            width: attachment.width,
            height: attachment.height
          };

          galleryImages.push(galleryEntry);
          changesMade = true;
          console.log(`New blob added: ${title} by ${galleryEntry.author}`);
        } catch (error) {
          console.error(`Error processing attachment ${attachment.id}:`, error);
        }
      }
    }

    // Sort by timestamp (newest first)
    galleryImages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Save updated gallery data if changes were made
    if (changesMade) {
      await saveGalleryData(galleryImages);
    }

    return NextResponse.json({
      images: galleryImages,
      totalCount: galleryImages.length,
      changes: changesMade
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}


// Webhook endpoint for real-time updates when reactions are added
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Process webhook payload for reaction events
    if (body.t === 'MESSAGE_REACTION_ADD' || body.t === 'MESSAGE_REACTION_REMOVE') {
      const { channel_id, message_id, user_id, emoji } = body.d;
      
      // Check if it's crown emoji in gallery channel
      if (channel_id === GALLERY_CHANNEL_ID && emoji.name === CROWN_EMOJI) {
        const guildId = process.env.DISCORD_GUILD_ID;
        const botToken = process.env.DISCORD_BOT_TOKEN;
        
        if (guildId && botToken) {
          // Check if user has approved role
          if (await hasApprovedRole(user_id, guildId, botToken)) {
            console.log(`Crown reaction ${body.t === 'MESSAGE_REACTION_ADD' ? 'added' : 'removed'}, triggering gallery update`);
            // Trigger gallery update by calling GET endpoint internally
            await GET();
          }
        }
      }
    }

    // Process webhook payload for message deletion
    if (body.t === 'MESSAGE_DELETE') {
      const { channel_id, id: message_id } = body.d;
      
      // Check if it's in gallery channel
      if (channel_id === GALLERY_CHANNEL_ID) {
        console.log('Message deleted in gallery channel, triggering gallery update');
        // Trigger gallery update to remove associated images
        await GET();
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}