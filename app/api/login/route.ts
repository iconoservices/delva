import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicio de sesión por teléfono / ID + contraseña, comprobado en el SERVIDOR.
//
// Antes se comparaba en el navegador contra la lista de usuarios descargada de la base (con la
// contraseña de cada uno adentro), lo que obligaba a exponer esa columna a cualquiera. Ahora la
// lista pública ya no la trae y la comprobación vive acá. Devuelve el usuario sin la contraseña.

export async function POST(request: Request) {
  let body: { identifier?: unknown; password?: unknown } = {};
  try { body = await request.json(); } catch { /* sin cuerpo */ }
  const identifier = typeof body.identifier === 'string' ? body.identifier.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!identifier || !password || identifier.length > 120 || password.length > 200) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } });

  // Dos consultas simples (en vez de un `.or()` armado con texto del usuario, que se podría manipular).
  const [porTelefono, porId] = await Promise.all([
    supabase.from('users').select('*').eq('phone', identifier).limit(5),
    supabase.from('users').select('*').eq('id', identifier).limit(5),
  ]);
  if (porTelefono.error && porId.error) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 503 });
  }

  const candidatos = [...(porTelefono.data ?? []), ...(porId.data ?? [])] as Record<string, unknown>[];
  const usuario = candidatos.find((u) => typeof u.password === 'string' && u.password === password);
  if (!usuario) return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });

  const { password: _omitida, ...sinContrasena } = usuario;
  void _omitida;
  return NextResponse.json({ user: sinContrasena });
}
