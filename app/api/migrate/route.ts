import { NextResponse } from 'next/server';
import { migrateDataToSupabase } from '@/lib/utils/migrateData';

export async function GET() {
  try {
    const logs = await migrateDataToSupabase();
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
