import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

// Datos públicos de la tienda en UN endpoint cacheado (productos, ajustes, banners y vendedores).
//
// Antes cada visitante le pedía a Supabase, desde su navegador, las tablas completas (incluida
// `users` con TODAS sus columnas) y además abría una conexión en tiempo real que volvía a bajar
// todo a todos con cada cambio. Con imágenes guardadas como base64 dentro de la base, cada visita
// costaba ~630 KB de egress. Ahora Supabase se consulta como mucho una vez cada 2 min y el resto
// sale del caché (Vercel y el navegador). Los visitantes NO reciben correos, teléfonos ni
// contraseñas de los usuarios, y las imágenes base64 salen por /api/media (cacheables aparte).

export const revalidate = 120;

const CABECERAS = { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600, stale-if-error=86400' };

// Solo lo que la tienda pública necesita saber de un vendedor.
const USUARIO_PUBLICO = [
  'id', 'name', 'role', 'initials', 'photoURL', 'storeName', 'storeBio', 'storeLogo', 'storeBanner',
  'themeId', 'customPrimary', 'customBg', 'customSurface', 'storeCategories', 'storeTags',
  'disabledDefaultCategories', 'isPremium', 'parentStoreId', 'status',
].join(',');

const esBase64 = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:image');
const version = (v: string) => createHash('sha1').update(v).digest('hex').slice(0, 10);
const urlMedia = (kind: string, id: string, v: string) => `/api/media/${kind}/${encodeURIComponent(id)}?v=${version(v)}`;

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const [products, users, settings, banners] = await Promise.all([
    supabase.from('products').select('*').eq('store', 'delva'),
    supabase.from('users').select(USUARIO_PUBLICO),
    supabase.from('settings').select('*').in('id', ['global', 'categories']),
    supabase.from('banners').select('*'),
  ]);

  // Si Supabase falla: 503 sin caché (no guardar datos vacíos) para que se pueda servir la última copia buena.
  if (products.error || users.error || settings.error || banners.error) {
    return NextResponse.json({ error: 'datos no disponibles' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }

  // Las imágenes guardadas como base64 dentro de la fila salen como URL aparte (cacheable para siempre).
  const usuarios = ((users.data ?? []) as unknown as Record<string, unknown>[]).map((u) => {
    const id = String(u.id);
    const salida = { ...u };
    if (esBase64(u.storeLogo)) salida.storeLogo = urlMedia('user-logo', id, u.storeLogo);
    if (esBase64(u.storeBanner)) salida.storeBanner = urlMedia('user-banner', id, u.storeBanner);
    if (esBase64(u.photoURL)) salida.photoURL = urlMedia('user-photo', id, u.photoURL);
    return salida;
  });
  const banners_ = ((banners.data ?? []) as Record<string, unknown>[]).map((b) =>
    esBase64(b.image) ? { ...b, image: urlMedia('banner', String(b.id), b.image) } : b,
  );

  return NextResponse.json(
    { products: products.data ?? [], users: usuarios, settings: settings.data ?? [], banners: banners_ },
    { headers: CABECERAS },
  );
}
