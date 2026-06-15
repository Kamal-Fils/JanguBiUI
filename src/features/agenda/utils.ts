// Constantes et utilitaires partagés par la liste (event-card) et le détail
// (/app/agenda/[id]) — source unique pour éviter la dérive entre les deux vues.

export const EVENT_TYPE_LABELS: Record<string, string> = {
  mass: 'Messe',
  conference: 'Conférence',
  retreat: 'Retraite',
  ordination: 'Ordination',
  other: 'Autre',
};

export const EVENT_TYPE_COLORS: Record<string, string> = {
  mass: 'bg-primary/10 text-primary',
  conference: 'bg-info/10 text-info',
  retreat: 'bg-success/10 text-success',
  ordination: 'bg-accent/15 text-accent',
  other: 'bg-muted text-muted-foreground',
};

export function formatEventDate(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  const dateStr = start.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const startTime = start.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endTime = end.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  if (sameDay) return `${dateStr} · ${startTime} – ${endTime}`;
  const endDateStr = end.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
  });
  return `${dateStr} ${startTime} – ${endDateStr} ${endTime}`;
}
