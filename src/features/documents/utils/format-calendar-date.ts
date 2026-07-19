/**
 * `<input type="date">` renvoie une date **calendaire** (`YYYY-MM-DD`), pas un
 * instant : la passer à `new Date()` la parse en UTC et peut décaler d'un jour
 * selon le fuseau. On reformate donc en pur texte (pas de `formatFrDate`, qui
 * traite des instants ISO).
 */
export function formatCalendarDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
