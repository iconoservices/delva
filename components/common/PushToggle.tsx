'use client';

import { useEffect, useState } from 'react';
import { pushDisponible, hayClave, avisosActivos, activarAvisos, desactivarAvisos, esIOS, enModoApp } from '@/lib/push';

// Campana de la cabecera: activa o desactiva los avisos de la tienda (ofertas y novedades).
// Solo aparece si el navegador los soporta. En iPhone exigen la app instalada: ahí explica cómo.
export default function PushToggle() {
  const [estado, setEstado] = useState<'oculto' | 'apagado' | 'activo' | 'ios' | 'trabajando'>('oculto');

  useEffect(() => {
    let vivo = true;
    (async () => {
      if (!hayClave()) return;
      if (esIOS() && !enModoApp()) { if (vivo) setEstado('ios'); return; }
      if (!pushDisponible()) return;
      const activos = await avisosActivos();
      if (vivo) setEstado(activos ? 'activo' : 'apagado');
    })();
    return () => { vivo = false; };
  }, []);

  if (estado === 'oculto') return null;

  const alTocar = async () => {
    if (estado === 'trabajando') return;
    if (estado === 'ios') {
      alert('Para recibir avisos en iPhone, primero instala DELVA en tu pantalla de inicio (botón de descarga) y actívalos desde la app.');
      return;
    }
    if (estado === 'activo') {
      setEstado('trabajando');
      await desactivarAvisos();
      setEstado('apagado');
      return;
    }
    setEstado('trabajando');
    const r = await activarAvisos();
    if (r === 'ok') setEstado('activo');
    else {
      setEstado('apagado');
      if (r === 'denegado') alert('Los avisos están bloqueados en este navegador. Puedes permitirlos en los ajustes del sitio.');
      else if (r === 'error') alert('No se pudieron activar los avisos. Intenta de nuevo.');
    }
  };

  const activo = estado === 'activo';
  return (
    <button
      className="nav-icon-btn"
      aria-label={activo ? 'Desactivar avisos' : 'Activar avisos'}
      title={activo ? 'Avisos activados (toca para desactivar)' : 'Recibir avisos de ofertas y novedades'}
      onClick={alTocar}
      style={{ position: 'relative', opacity: estado === 'trabajando' ? 0.5 : 1 }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={activo ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
    </button>
  );
}
