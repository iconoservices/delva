import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy singleton — no se instancia hasta que se llame por primera vez en runtime.
// Evita el crash de Next.js durante el prerendering estático donde las env vars no existen.
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase env vars are not set');
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Alias de compatibilidad para que los imports existentes de `supabase` sigan funcionando
// sin tener que refactorizar todos los archivos de una vez.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as any)[prop];
  },
});
