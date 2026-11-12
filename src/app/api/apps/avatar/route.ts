import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUserByTelegramChatIdAsync, getUserByTelegramUsernameAsync, getUserByIdAsync } from '@/lib/db';

export const dynamic = 'force-dynamic';

const BOT_TOKENS = [
  (process.env.TELEGRAM_BOT_TOKEN || '8886426395:AAHTtOA5ilIoNUfmcfVf44mCK6gJo7gjhd0').trim(),
  (process.env.MAXBAZAR_BOT_TOKEN || '').trim(),
].filter(Boolean);

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'micro_apps');

async function resolveTelegramChatId(identifier: string): Promise<string | null> {
  const clean = identifier.trim().replace(/^@/, '').toLowerCase();
  if (/^\d{5,16}$/.test(clean)) return clean;

  // 1. Try DB lookup by username
  try {
    const userByUsername = await getUserByTelegramUsernameAsync(clean);
    if (userByUsername?.telegramChatId) {
      return String(userByUsername.telegramChatId);
    }
  } catch {}

  // 2. Try DB lookup by user UUID
  try {
    const userById = await getUserByIdAsync(identifier.trim());
    if (userById?.telegramChatId) {
      return String(userById.telegramChatId);
    }
  } catch {}

  // 3. Try local mapping file
  const usersFile = path.join(SESSIONS_DIR, 'telegram_users.json');
  try {
    if (fs.existsSync(usersFile)) {
      const mapping = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      if (mapping[clean]) return String(mapping[clean]);
    }
  } catch {}

  // 4. Default admin chat mapping
  const adminUser = (process.env.TELEGRAM_ADMIN_USERNAME || 'nasrulla0996').toLowerCase();
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID || '7575664493';
  if (clean === adminUser && adminChat) {
    return adminChat;
  }

  return null;
}

function generateFallbackAvatarSvg(label: string): string {
  const initial = (label || 'A').trim().charAt(0).toUpperCase();
  let hash = 0;
  for (let i = 0; i < label.length; i++) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  const hues = [200, 220, 260, 280, 170, 35];
  const hue = hues[Math.abs(hash) % hues.length];

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl(${hue}, 85%, 55%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 35) % 360}, 85%, 35%)"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="64" fill="url(#g)"/>
  <text x="64" y="76" font-size="52" font-weight="900" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" fill="#ffffff" text-anchor="middle">${initial}</text>
</svg>`.trim();
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUser = searchParams.get('user') || searchParams.get('identity') || searchParams.get('id') || '';
    if (!rawUser) {
      const svg = generateFallbackAvatarSvg('User');
      return new NextResponse(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const clean = rawUser.trim().replace(/^@/, '');
    const chatId = await resolveTelegramChatId(clean);

    // If numeric chatId found, query Telegram Bot API for real avatar
    if (chatId) {
      for (const botToken of BOT_TOKENS) {
        try {
          const photosRes = await fetch(
            `https://api.telegram.org/bot${botToken}/getUserProfilePhotos?user_id=${chatId}&limit=1`,
            { cache: 'no-store' }
          );
          const photosData = await photosRes.json();
          if (photosData.ok && photosData.result?.total_count > 0) {
            const photoArray = photosData.result.photos[0];
            const targetPhoto = photoArray[photoArray.length - 1] || photoArray[0];
            if (targetPhoto?.file_id) {
              const fileRes = await fetch(
                `https://api.telegram.org/bot${botToken}/getFile?file_id=${targetPhoto.file_id}`
              );
              const fileData = await fileRes.json();
              if (fileData.ok && fileData.result?.file_path) {
                const directUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
                const imgRes = await fetch(directUrl);
                if (imgRes.ok) {
                  const buffer = await imgRes.arrayBuffer();
                  const contentType = imgRes.headers.get('content-type') || 'image/jpeg';
                  return new NextResponse(buffer, {
                    status: 200,
                    headers: {
                      'Content-Type': contentType,
                      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
                    },
                  });
                }
              }
            }
          }
        } catch (err: any) {
          console.warn('[Avatar Route Warn]:', err?.message);
        }
      }
    }

    // Direct inline SVG fallback (100% reliable, zero broken images in Android WebViews)
    const svg = generateFallbackAvatarSvg(clean);
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err: any) {
    const fallbackSvg = generateFallbackAvatarSvg('User');
    return new NextResponse(fallbackSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
}
