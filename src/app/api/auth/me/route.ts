import { NextResponse } from 'next/server';
import { getUserByEmail, getUserById } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    if (!email && !id) {
      return NextResponse.json(
        { success: false, message: 'ئىشلەتكۈچى كىملىكى ياكى ئېلخىتى يوق' },
        { status: 400 }
      );
    }

    const user = id ? getUserById(id) : getUserByEmail(email!);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ئىشلەتكۈچى تېپىلمىدى' },
        { status: 404 }
      );
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      balance: user.balance,
      totalSpent: user.totalSpent,
      vipTier: user.vipTier,
      role: user.role,
      createdAt: user.createdAt,
    };

    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'ئىشلەتكۈچى ئۇچۇرىنى ئېلىش مەغلۇپ بولدى' },
      { status: 500 }
    );
  }
}
