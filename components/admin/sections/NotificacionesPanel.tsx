'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Panel del master: enviar una campaña de notificaciones a quienes activaron los avisos.
type Estado = {
  suscriptores: number; restantesSemana: number; usadasSemana: number; usadasDia: number; puedeHoy: boolean;
  dentroDeHorario: boolean; tablasListas: boolean;
  limites: { maxPorSemana: number; maxPorDia: number; horaDesde: number; horaHasta: number };
  ultimas: { id: number; titulo: string; cuerpo: string; enviados: number; fallidos: number; creada_at: string }[];
};

export default function NotificacionesPanel() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [error, setError] = useState('');
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [url, setUrl] = useState('/');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const token = async () => (await supabase.auth.getSession()).data.session?.access_token || '';

  const cargar = async () => {
    setError('');
    try {
      const r = await fetch('/api/push/enviar', { headers: { Authorization: `Bearer ${await token()}` } });
      const j = await r.json();
      if (!r.ok) { setError(j.error || 'No se pudo cargar'); return; }
      setEstado(j);
    } catch { setError('No se pudo cargar'); }
  };
  useEffect(() => { cargar(); }, []);

  const enviar = async () => {
    setMensaje('');
    if (!titulo.trim() || !cuerpo.trim()) { setMensaje('Escribe el título y el texto.'); return; }
    if (!window.confirm(`¿Enviar "${titulo}" a ${estado?.suscriptores ?? 0} personas? No se puede deshacer.`)) return;
    setEnviando(true);
    try {
      const r = await fetch('/api/push/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await token()}` },
        body: JSON.stringify({ titulo, cuerpo, url }),
      });
      const j = await r.json();
      if (!r.ok) setMensaje(j.error || 'No se pudo enviar');
      else {
        setMensaje(`✅ Enviada a ${j.enviados} personas${j.fallidos ? ` (${j.fallidos} no la recibieron)` : ''}.`);
        setTitulo(''); setCuerpo(''); setUrl('/');
        cargar();
      }
    } catch { setMensaje('No se pudo enviar'); }
    setEnviando(false);
  };

  const caja: React.CSSProperties = { background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid #eee', marginBottom: '16px' };
  const campo: React.CSSProperties = { width: '100%', marginBottom: '10px' };

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ marginBottom: '6px' }}>🔔 Notificaciones</h2>
      <p style={{ opacity: 0.65, fontSize: '0.85rem', marginBottom: '20px' }}>
        Envía ofertas o novedades a quienes activaron los avisos de la tienda.
      </p>

      {error && <div style={{ ...caja, borderColor: '#f3b1b1', color: '#a33' }}>{error}</div>}

      {estado && !estado.tablasListas && (
        <div style={{ ...caja, borderColor: '#f0d58c' }}>
          Falta crear las tablas: corre <b>supabase_push.sql</b> en el SQL editor de Supabase.
        </div>
      )}

      {estado && (
        <>
          <div style={{ ...caja, display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div><div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{estado.suscriptores}</div><div style={{ fontSize: '0.75rem', opacity: 0.6 }}>suscriptores</div></div>
            <div><div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{estado.restantesSemana}/{estado.limites.maxPorSemana}</div><div style={{ fontSize: '0.75rem', opacity: 0.6 }}>campañas disponibles esta semana</div></div>
            <div style={{ fontSize: '0.75rem', opacity: 0.6, alignSelf: 'center' }}>
              Máximo {estado.limites.maxPorDia} por día · se envía de {estado.limites.horaDesde}:00 a {estado.limites.horaHasta}:00 (Lima)
              {!estado.dentroDeHorario && <b style={{ color: '#a60' }}> · ahora está fuera de horario</b>}
            </div>
          </div>

          <div style={caja}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Nueva campaña</h3>
            <input style={campo} maxLength={60} placeholder="Título (ej. 🔥 Ofertas del fin de semana)" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            <textarea style={{ ...campo, minHeight: '80px' }} maxLength={160} placeholder="Texto corto (máx. 160 caracteres)" value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
            <input style={campo} placeholder="A dónde lleva al tocarla (ej. /categoria/ropa). Vacío = inicio" value={url} onChange={(e) => setUrl(e.target.value || '/')} />
            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '12px' }}>{titulo.length}/60 · {cuerpo.length}/160</div>
            <button className="btn-cart" style={{ width: '100%' }} disabled={enviando || !estado.puedeHoy} onClick={enviar}>
              {enviando ? 'Enviando…' : estado.puedeHoy ? 'Enviar a todos los suscriptores' : 'Límite de campañas alcanzado'}
            </button>
            {mensaje && <p style={{ marginTop: '12px', fontSize: '0.85rem' }}>{mensaje}</p>}
          </div>

          {estado.ultimas.length > 0 && (
            <div style={caja}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Últimas campañas</h3>
              {estado.ultimas.map((c) => (
                <div key={c.id} style={{ padding: '10px 0', borderTop: '1px solid #f2f2f2', fontSize: '0.85rem' }}>
                  <b>{c.titulo}</b>
                  <div style={{ opacity: 0.7 }}>{c.cuerpo}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '4px' }}>
                    {new Date(c.creada_at).toLocaleString('es-PE', { timeZone: 'America/Lima' })} · enviada a {c.enviados}{c.fallidos ? ` · ${c.fallidos} fallaron` : ''}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
