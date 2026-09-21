import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { perfilDeToken } from '@/lib/perfilServidor';
import { PUSH_LIMITES, dentroDeHorario } from '@/lib/pushLimites';

// Campañas de notificaciones de DELVA. Solo el MASTER (comprobado en el servidor con su sesión de
// BogaHub). GET devuelve el estado (suscriptores, cupo restante, últimas campañas); POST envía.

export const runtime = 'nodejs';

const cliente = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
};

async function soloMaster(request: Request) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '');
  const perfil = await perfilDeToken(token);
  if (!perfil) return { error: NextResponse.json({ error: 'Sesión inválida' }, { status: 401 }) };
  if (perfil.user.role !== 'master') return { error: NextResponse.json({ error: 'Solo el master puede enviar' }, { status: 403 }) };
  return { perfil };
}

async function cupo(supabase: NonNullable<ReturnType<typeof cliente>>) {
  const hace7d = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const hace24h = new Date(Date.now() - 86_400_000).toISOString();
  const [semana, dia] = await Promise.all([
    supabase.from('delva_push_campanas').select('id', { count: 'exact', head: true }).gte('creada_at', hace7d),
    supabase.from('delva_push_campanas').select('id', { count: 'exact', head: true }).gte('creada_at', hace24h),
  ]);
  const usadasSemana = semana.count ?? 0, usadasDia = dia.count ?? 0;
  return {
    usadasSemana, usadasDia,
    restantesSemana: Math.max(0, PUSH_LIMITES.maxPorSemana - usadasSemana),
    puedeHoy: usadasDia < PUSH_LIMITES.maxPorDia && usadasSemana < PUSH_LIMITES.maxPorSemana,
  };
}

export async function GET(request: Request) {
  const auth = await soloMaster(request);
  if (auth.error) return auth.error;
  const supabase = cliente();
  if (!supabase) return NextResponse.json({ error: 'Servidor sin configurar (falta SUPABASE_SERVICE_ROLE_KEY)' }, { status: 500 });

  const [subs, ultimas, q] = await Promise.all([
    supabase.from('delva_push_subs').select('endpoint', { count: 'exact', head: true }),
    supabase.from('delva_push_campanas').select('id,titulo,cuerpo,enviados,fallidos,creada_at').order('creada_at', { ascending: false }).limit(8),
    cupo(supabase),
  ]);
  return NextResponse.json({
    suscriptores: subs.count ?? 0,
    ultimas: ultimas.data ?? [],
    limites: PUSH_LIMITES,
    dentroDeHorario: dentroDeHorario(),
    ...q,
    tablasListas: !subs.error,
  });
}

export async function POST(request: Request) {
  const auth = await soloMaster(request);
  if (auth.error) return auth.error;
  const supabase = cliente();
  if (!supabase) return NextResponse.json({ error: 'Servidor sin configurar (falta SUPABASE_SERVICE_ROLE_KEY)' }, { status: 500 });

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return NextResponse.json({ error: 'Faltan las claves VAPID en el servidor' }, { status: 500 });

  const body = await request.json().catch(() => null) as { titulo?: unknown; cuerpo?: unknown; url?: unknown } | null;
  const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
  const cuerpo = typeof body?.cuerpo === 'string' ? body.cuerpo.trim() : '';
  let url = typeof body?.url === 'string' ? body.url.trim() : '/';
  if (!titulo || titulo.length > 60) return NextResponse.json({ error: 'El título es obligatorio (máximo 60 caracteres)' }, { status: 400 });
  if (!cuerpo || cuerpo.length > 160) return NextResponse.json({ error: 'El texto es obligatorio (máximo 160 caracteres)' }, { status: 400 });
  // Solo links de esta misma tienda (o una ruta interna): un aviso no puede mandar a cualquier sitio.
  if (!url.startsWith('/')) {
    try { const u = new URL(url); if (u.host !== new URL(request.url).host) url = '/'; else url = u.pathname + u.search; } catch { url = '/'; }
  }

  if (!dentroDeHorario()) {
    return NextResponse.json({ error: `Solo se envía entre las ${PUSH_LIMITES.horaDesde}:00 y las ${PUSH_LIMITES.horaHasta}:00 (hora de Lima).` }, { status: 409 });
  }
  const q = await cupo(supabase);
  if (!q.puedeHoy) {
    return NextResponse.json({
      error: q.usadasDia >= PUSH_LIMITES.maxPorDia
        ? 'Ya enviaste una campaña en las últimas 24 horas.'
        : `Llegaste al límite de ${PUSH_LIMITES.maxPorSemana} campañas por semana.`,
    }, { status: 429 });
  }

  const { data: subs, error: errSubs } = await supabase.from('delva_push_subs').select('endpoint,p256dh,auth');
  if (errSubs) return NextResponse.json({ error: 'No se pudieron leer los suscriptores (¿corriste supabase_push.sql?)' }, { status: 500 });
  if (!subs || subs.length === 0) return NextResponse.json({ error: 'Todavía no hay nadie suscrito a los avisos.' }, { status: 400 });

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:jnmcsky@gmail.com', pub, priv);
  const carga = JSON.stringify({ title: titulo, body: cuerpo, url, tag: 'delva-campana' });

  let enviados = 0, fallidos = 0;
  const muertas: string[] = [];
  const LOTE = 25;
  for (let i = 0; i < subs.length; i += LOTE) {
    const resultados = await Promise.allSettled(
      subs.slice(i, i + LOTE).map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, { TTL: 86_400 }),
      ),
    );
    resultados.forEach((r, j) => {
      if (r.status === 'fulfilled') enviados++;
      else {
        fallidos++;
        const code = (r.reason as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) muertas.push(subs[i + j].endpoint); // el navegador ya no la acepta
      }
    });
  }
  if (muertas.length) await supabase.from('delva_push_subs').delete().in('endpoint', muertas);

  await supabase.from('delva_push_campanas').insert({
    titulo, cuerpo, url, enviada_por: String(auth.perfil!.user.id), enviados, fallidos,
  });
  return NextResponse.json({ ok: true, enviados, fallidos, limpiadas: muertas.length });
}
