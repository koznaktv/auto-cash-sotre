import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MAXBAZAR_BOT_TOKEN =
  process.env.MAXBAZAR_BOT_TOKEN || '9030046429:AAGgis0NFr7PPAZpsri7AJbvckZboj81J7c';

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'micro_apps');

function getTelegramUserChatId(identifier: string): string | null {
  const clean = identifier.trim().replace(/^@/, '').toLowerCase();
  if (/^\d+$/.test(clean)) return clean;

  const usersFile = path.join(SESSIONS_DIR, 'telegram_users.json');
  try {
    if (fs.existsSync(usersFile)) {
      const mapping = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
      if (mapping[clean]) return String(mapping[clean]);
    }
  } catch {}

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
    const user = searchParams.get('user') || searchParams.get('identity') || '';
    if (!user) {
      return NextResponse.redirect('https://t.me/i/userpic/320/telegram.jpg');
    }

    const clean = user.trim().replace(/^@/, '');
    const chatId = getTelegramUserChatId(clean);

    // If we have numeric chatId, query Telegram Bot API for high-res avatar
    if (chatId) {
      try {
        const photosRes = await fetch(
          `https://api.telegram.org/bot${MAXBAZAR_BOT_TOKEN}/getUserProfilePhotos?user_id=${chatId}&limit=1`,
          { cache: 'no-store' }
        );
        const photosData = await photosRes.json();
        if (photosData.ok && photosData.result?.total_count > 0) {
          const photoArray = photosData.result.photos[0];
          // Get medium or large photo
          const targetPhoto = photoArray[1] || photoArray[0];
          if (targetPhoto?.file_id) {
            const fileRes = await fetch(
              `https://api.telegram.org/bot${MAXBAZAR_BOT_TOKEN}/getFile?file_id=${targetPhoto.file_id}`
            );
            const fileData = await fileRes.json();
            if (fileData.ok && fileData.result?.file_path) {
              const directUrl = `https://api.telegram.org/file/bot${MAXBAZAR_BOT_TOKEN}/${fileData.result.file_path}`;
              return NextResponse.redirect(directUrl, 307);
            }
          }
        }
      } catch (err: any) {
        console.warn('[Avatar Route Warn]:', err?.message);
      }
    }

    // Fallback: Telegram public web avatar by username
    if (!/^\d+$/.test(clean)) {
      return NextResponse.redirect(`https://t.me/i/userpic/320/${clean}.jpg`, 307);
    }

    return NextResponse.redirect('https://t.me/i/userpic/320/telegram.jpg', 307);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
