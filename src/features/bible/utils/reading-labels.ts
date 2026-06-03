const LABEL_MAP: Record<string, string> = {
  lecture1: 'Première Lecture',
  lecture_1: 'Première Lecture',
  'lecture 1': 'Première Lecture',
  'première lecture': 'Première Lecture',
  lecture2: 'Deuxième Lecture',
  lecture_2: 'Deuxième Lecture',
  'lecture 2': 'Deuxième Lecture',
  'deuxième lecture': 'Deuxième Lecture',
  lecture3: 'Troisième Lecture',
  psaume: 'Psaume',
  gospel: 'Évangile',
  evangile: 'Évangile',
  évangile: 'Évangile',
  alleluia: 'Alléluia',
  alléluia: 'Alléluia',
};

export function normalizeReadingLabel(raw: string): string {
  return LABEL_MAP[raw.toLowerCase().trim()] ?? raw;
}

export function getReadingAccentClass(normalizedLabel: string): string {
  const l = normalizedLabel.toLowerCase();
  // Accents tokenisés (theme-aware) plutôt que des couleurs littérales ad-hoc.
  if (l.includes('psaume')) return 'text-accent';
  if (l.includes('évangile') || l.includes('evangile')) return 'text-primary';
  if (l.includes('deuxième') || l.includes('troisième')) return 'text-info';
  return 'text-primary';
}
