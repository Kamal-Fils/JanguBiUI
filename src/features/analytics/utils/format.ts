/** Formate un montant XOF. `compact` → notation courte pour les axes (12,5k). */
export function formatXof(amount: number, compact = false): string {
  if (compact) {
    if (Math.abs(amount) >= 1_000_000)
      return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M`;
    if (Math.abs(amount) >= 1_000)
      return `${(amount / 1_000).toFixed(1).replace('.0', '')}k`;
    return String(amount);
  }
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}

const GRANULARITY_LABELS: Record<string, string> = {
  day: 'Jour',
  week: 'Semaine',
  month: 'Mois',
};

export const granularityLabel = (g: string): string =>
  GRANULARITY_LABELS[g] ?? g;
