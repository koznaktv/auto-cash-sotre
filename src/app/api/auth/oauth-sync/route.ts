import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserByEmailAsync, createUserAsync } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, avatarUrl, provider = 'google' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'ئېلخەت ئادرېسى كەم' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await getUserByEmailAsync(cleanEmail);
    let isNew = false;

    if (!user) {
      // Create new user for first-time Google sign in
      const defaultName = (name && name.trim()) || cleanEmail.split('@')[0];
      const randomPassword = crypto.randomBytes(24).toString('hex');
      
      user = await createUserAsync({
        name: defaultName,
        email: cleanEmail,
        password: randomPassword,
        avatarUrl: avatarUrl || undefined,
        role: 'user',
      });
      isNew = true;
    } else if (avatarUrl && !user.avatarUrl) {
      // Update avatar for existing user
      const { updateUserAsync } = await import('@/lib/db');
      await updateUserAsync(user.id, { avatarUrl });
      user.avatarUrl = avatarUrl;
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      balance: user.balance || 0.0,
      totalSpent: user.totalSpent || 0.0,
      vipTier: user.vipTier || 'vip1',
      role: user.role || 'user',
      avatarUrl: avatarUrl || user.avatarUrl || undefined,
      createdAt: user.createdAt,
    };

    return NextResponse.json({
      success: true,
      user: safeUser,
      isNew,
      provider,
    });
  } catch (err: any) {
    console.error('OAuth sync error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Google ئارقىلىق كىرىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
