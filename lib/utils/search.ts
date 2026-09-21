// Búsqueda tolerante: ignora mayúsculas y tildes, y exige que aparezcan todas las palabras.
export const normalize = (s: string) =>
    (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

export const matchesQuery = (fields: (string | undefined | null)[], query: string) => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;
    const haystack = normalize(fields.filter(Boolean).join(' '));
    return words.every(w => haystack.includes(w));
};
