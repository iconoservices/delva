// Notificaciones push del lado del navegador (la app instalada o la pestaña).
// Requiere NEXT_PUBLIC_VAPID_PUBLIC_KEY (la clave pública; la privada vive solo en el servidor).

const CLAVE = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

export const hayClave = () => !!CLAVE;

export const pushDisponible = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && !!CLAVE;

export const esIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);

// En iPhone las notificaciones solo funcionan con la app instalada en la pantalla de inicio.
export const enModoApp = () =>
  typeof window !== 'undefined' &&
  (!!(window.navigator as unknown as { standalone?: boolean }).standalone || window.matchMedia('(display-mode: standalone)').matches);

const aBytes = (b64: string) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

async function registro() {
  await navigator.serviceWorker.register('/sw.js');
  return navigator.serviceWorker.ready;
}

export async function avisosActivos(): Promise<boolean> {
  if (!pushDisponible() || Notification.permission !== 'granted') return false;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  return !!(reg && (await reg.pushManager.getSubscription()));
}

export async function activarAvisos(): Promise<'ok' | 'denegado' | 'no-soportado' | 'error'> {
  if (!pushDisponible()) return 'no-soportado';
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return 'denegado';
  try {
    const reg = await registro();
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(CLAVE!) as BufferSource }));
    const res = await fetch('/api/push/suscribir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    });
    return res.ok ? 'ok' : 'error';
  } catch {
    return 'error';
  }
}

export async function desactivarAvisos() {
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return;
  await fetch('/api/push/baja', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: sub.endpoint }),
  }).catch(() => {});
  await sub.unsubscribe();
}
