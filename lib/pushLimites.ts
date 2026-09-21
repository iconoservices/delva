// Límites de las campañas de notificaciones, para que la gente no termine silenciando los avisos.
// Se cambian acá, en un solo lugar. (Más adelante pueden depender del plan de la tienda.)
export const PUSH_LIMITES = {
  maxPorSemana: 3,      // campañas en los últimos 7 días
  maxPorDia: 1,         // campañas en las últimas 24 horas
  horaDesde: 8,         // no se envía antes de esta hora (Lima)
  horaHasta: 22,        // ni a partir de esta hora (Lima)
  zona: 'America/Lima',
};

export const horaEnLima = (d = new Date()) =>
  Number(new Intl.DateTimeFormat('en-US', { timeZone: PUSH_LIMITES.zona, hour: 'numeric', hourCycle: 'h23' }).format(d));

export const dentroDeHorario = (d = new Date()) => {
  const h = horaEnLima(d);
  return h >= PUSH_LIMITES.horaDesde && h < PUSH_LIMITES.horaHasta;
};
