import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Guarda la suscripción a notificaciones de un navegador. Cualquiera puede suscribirse (es un
// visitante que aceptó recibir avisos), por eso va por acá con la clave de servicio y no directo
// a la base: la tabla no tiene acceso público.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const endpoint = body?.endpoint, p256dh = body?.keys?.p256dh, auth = body?.keys?.auth;
  if (typeof endpoint !== 'string' || typeof p256dh !== 'string' || typeof auth !== 'string'
    || !endpoint.startsWith('https://') || endpoint.length > 1000 || p256dh.length > 200 || auth.length > 100) {
    return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return NextResponse.json({ error: 'Servidor sin configurar' }, { status: 500 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const { error } = await supabase.from('delva_push_subs').upsert(
    { endpoint, p256dh, auth, user_agent: (request.headers.get('user-agent') || '').slice(0, 200) },
    { onConflict: 'endpoint' },
  );
  if (error) return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
