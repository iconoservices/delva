import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Sirve como imagen normal las que están guardadas como base64 dentro de la base (banners y
// logos/fotos de vendedores). La URL lleva `?v=<hash del contenido>`, así que si la imagen cambia
// la URL cambia y este archivo se puede cachear "para siempre" sin riesgo de mostrar una vieja.

const FUENTES: Record<string, { tabla: string; columna: string }> = {
  'banner': { tabla: 'banners', columna: 'image' },
  'user-logo': { tabla: 'users', columna: 'storeLogo' },
  'user-banner': { tabla: 'users', columna: 'storeBanner' },
  'user-photo': { tabla: 'users', columna: 'photoURL' },
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  const fuente = FUENTES[kind];
  if (!fuente) return new NextResponse('No encontrado', { status: 404 });

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });
  const { data, error } = await supabase.from(fuente.tabla).select(fuente.columna).eq('id', id).maybeSingle();
  if (error) return new NextResponse('No disponible', { status: 503, headers: { 'Cache-Control': 'no-store' } });

  const valor = (data as Record<string, unknown> | null)?.[fuente.columna];
  if (typeof valor !== 'string' || !valor) return new NextResponse('No encontrado', { status: 404 });

  const m = valor.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/s);
  if (!m) {
    // Ya es una URL normal: se redirige (por si la imagen se cambió a una URL después)
    return NextResponse.redirect(valor, { status: 302, headers: { 'Cache-Control': 'public, s-maxage=300' } });
  }
  return new NextResponse(Buffer.from(m[2], 'base64'), {
    headers: {
      'Content-Type': m[1],
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    },
  });
}
