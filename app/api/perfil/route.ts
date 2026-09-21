import { NextResponse } from 'next/server';
import { perfilDeToken } from '@/lib/perfilServidor';

// Perfil de Delva de quien inició sesión con su cuenta de BogaHub (Supabase Auth).
// El token se COMPRUEBA en el servidor (ver lib/perfilServidor.ts); nada del cliente se da por bueno.
export async function GET(request: Request) {
  const token = (request.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const perfil = await perfilDeToken(token);
  if (!perfil) return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 });
  return NextResponse.json(perfil);
}
