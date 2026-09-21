import { createHash } from 'crypto';

// Lo que se puede mostrar de un usuario/vendedor sin ser él: nada de correo, teléfono ni contraseña.
export const USUARIO_PUBLICO = [
  'id', 'name', 'role', 'initials', 'photoURL', 'storeName', 'storeBio', 'storeLogo', 'storeBanner',
  'themeId', 'customPrimary', 'customBg', 'customSurface', 'storeCategories', 'storeTags',
  'disabledDefaultCategories', 'isPremium', 'parentStoreId', 'status',
].join(',');

const esBase64 = (v: unknown): v is string => typeof v === 'string' && v.startsWith('data:image');
const version = (v: string) => createHash('sha1').update(v).digest('hex').slice(0, 10);
export const urlMedia = (kind: string, id: string, v: string) => `/api/media/${kind}/${encodeURIComponent(id)}?v=${version(v)}`;

// Las imágenes guardadas como base64 dentro de la fila salen como URL aparte (cacheable para siempre).
export function usuarioPublico(u: Record<string, unknown>): Record<string, unknown> {
  const id = String(u.id);
  const salida = { ...u };
  if (esBase64(u.storeLogo)) salida.storeLogo = urlMedia('user-logo', id, u.storeLogo);
  if (esBase64(u.storeBanner)) salida.storeBanner = urlMedia('user-banner', id, u.storeBanner);
  if (esBase64(u.photoURL)) salida.photoURL = urlMedia('user-photo', id, u.photoURL);
  return salida;
}

export { esBase64, urlMedia as _urlMedia };
