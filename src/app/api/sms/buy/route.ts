import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message: '⚠️ مەۋھۇم نومۇر مۇلازىمىتى تېخنىكىلىق رېمونت سەۋەبىدىن ۋاقىتلىق توختىتىلدى. پات يېقىندا قايتا ئېچىلىدۇ.',
    },
    { status: 503 }
  );
}
