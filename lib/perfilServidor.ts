import { createClient } from '@supabase/supabase-js';
import { USUARIO_PUBLICO, usuarioPublico } from '@/lib/usuarioPublico';

// Comprueba en el SERVIDOR quién es el dueño de un token de sesión de BogaHub (Supabase Auth) y
// qué perfil de Delva le toca. Lo usan /api/perfil y las rutas que exigen ser master.
//   - superadmin de Boga (`is_superadmin()` en la base)  → perfil "master".
//   - correo que coincide con una fila de `users`         → esa fila.
//   - cuenta nueva sin fila                               → cliente.
export type PerfilServidor = { user: Record<string, unknown>; via: 'superadmin' | 'correo' | 'nueva' };

export async function perfilDeToken(token: string): Promise<PerfilServidor | null> {
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const comoUsuario = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });

  const { data: { user }, error } = await comoUsuario.auth.getUser(token);
  if (error || !user) return null;

  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY || anon, { auth: { persistSession: false } });

  const { data: esSuperadmin } = await comoUsuario.rpc('is_superadmin');
  if (esSuperadmin === true) {
    const { data: master } = await admin.from('users').select(USUARIO_PUBLICO).eq('id', 'master').maybeSingle();
    if (master) return { user: usuarioPublico(master as unknown as Record<string, unknown>), via: 'superadmin' };
  }

  const correo = (user.email || '').trim();
  if (correo) {
    const { data: filas } = await admin.from('users').select(USUARIO_PUBLICO).in('email', [correo, correo.toLowerCase()]).limit(1);
    const fila = (filas ?? [])[0] as unknown as Record<string, unknown> | undefined;
    if (fila) return { user: usuarioPublico(fila), via: 'correo' };
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const nombre = String(meta.name || meta.full_name || correo.split('@')[0] || 'Cliente');
  return {
    user: {
      id: user.id,
      name: nombre,
      role: 'customer',
      initials: nombre.slice(0, 2).toUpperCase(),
      photoURL: typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined,
    },
    via: 'nueva',
  };
}
