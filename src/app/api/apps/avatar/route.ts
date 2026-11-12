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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUser = searchParams.get('user') || searchParams.get('identity') || searchParams.get('id') || '';
    if (!rawUser) {
      return NextResponse.redirect('https://api.dicebear.com/7.x/bottts/svg?seed=user');
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
            // Take the highest resolution photo (usually last or second)
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

    // Fallback 1: Telegram public username avatar
    if (!/^\d+$/.test(clean)) {
      try {
        const publicUrl = `https://t.me/i/userpic/320/${clean}.jpg`;
        const checkRes = await fetch(publicUrl, { method: 'HEAD' });
        if (checkRes.ok && checkRes.headers.get('content-type')?.startsWith('image')) {
          return NextResponse.redirect(publicUrl, 307);
        }
      } catch {}
    }

    // Fallback 2: Dicebear SVG avatar
    return NextResponse.redirect(`https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(clean)}`, 307);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
