import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Da de baja una suscripción (el usuario apagó los avisos).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { endpoint?: unknown } | null;
  const endpoint = body?.endpoint;
  if (typeof endpoint !== 'string' || !endpoint.startsWith('https://') || endpoint.length > 1000) {
    return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ error: 'Servidor sin configurar' }, { status: 500 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  await supabase.from('delva_push_subs').delete().eq('endpoint', endpoint);
  return NextResponse.json({ ok: true });
}
