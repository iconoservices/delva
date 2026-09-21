import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { USUARIO_PUBLICO, usuarioPublico } from '@/lib/usuarioPublico';

// Perfil de Delva de quien inició sesión con su cuenta de BogaHub (Supabase Auth).
//
// El navegador manda el token de su sesión; acá se COMPRUEBA con Supabase (no se confía en nada
// que venga del cliente) y se decide qué perfil le toca:
//   - superadmin de Boga (`is_superadmin()` en la base)  → perfil "master" de Delva.
//   - correo que coincide con una fila de `users`         → esa fila (staff o cliente).
//   - cuenta nueva sin fila                               → cliente con los datos de la cuenta.
// Nunca devuelve correo, teléfono ni contraseña de otros: solo el perfil de quien pregunta.

export async function GET(request: Request) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const comoUsuario = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error: authError } = await comoUsuario.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });

  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || anon, { auth: { persistSession: false } });

  // 1) Superadmin de Boga = master de Delva
  const { data: esSuperadmin } = await comoUsuario.rpc('is_superadmin');
  if (esSuperadmin === true) {
    const { data: master } = await admin.from('users').select(USUARIO_PUBLICO).eq('id', 'master').maybeSingle();
    if (master) return NextResponse.json({ user: usuarioPublico(master as unknown as Record<string, unknown>), via: 'superadmin' });
  }

  // 2) Fila de Delva con el mismo correo
  const correo = (user.email || '').trim();
  if (correo) {
    const { data: filas } = await admin
      .from('users')
      .select(USUARIO_PUBLICO)
      .in('email', [correo, correo.toLowerCase()])
      .limit(1);
    const fila = (filas ?? [])[0] as unknown as Record<string, unknown> | undefined;
    if (fila) return NextResponse.json({ user: usuarioPublico(fila), via: 'correo' });
  }

  // 3) Cuenta nueva: cliente sin fila todavía
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nombre = String(meta.name || meta.full_name || correo.split('@')[0] || 'Cliente');
  return NextResponse.json({
    user: {
      id: user.id,
      name: nombre,
      role: 'customer',
      initials: nombre.slice(0, 2).toUpperCase(),
      photoURL: typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined,
    },
    via: 'nueva',
  });
}
