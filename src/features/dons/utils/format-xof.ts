/** Formate un montant en francs CFA — « 5 000 XOF ». */
export function formatXof(value: number | string): string {
  return `${Number(value).toLocaleString('fr-FR')} XOF`;
}
