import { NextResponse } from 'next/server';
import { listHardware } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ hardware: listHardware() });
}
