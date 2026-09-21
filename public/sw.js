// Service worker de DELVA: solo recibe y muestra notificaciones push.
// No guarda páginas ni datos en caché (no cambia cómo carga la tienda).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(
    self.registration.showNotification(d.title || 'DELVA', {
      body: d.body || '',
      icon: '/pwa-icon-192.png',
      badge: '/pwa-icon-192.png',
      tag: d.tag || 'delva',
      data: { url: d.url || '/' },
    }),
  );
});

// Al tocar el aviso: enfoca la app si ya está abierta, o la abre en el link del aviso.
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      const abierta = cs.find((c) => 'focus' in c);
      return abierta ? abierta.focus() : self.clients.openWindow(url);
    }),
  );
});
