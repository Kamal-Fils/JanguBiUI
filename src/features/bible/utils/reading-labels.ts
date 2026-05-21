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
  if (l.includes('psaume')) return 'text-violet-600 dark:text-violet-400';
  if (l.includes('évangile') || l.includes('evangile'))
    return 'text-amber-600 dark:text-amber-400';
  if (l.includes('deuxième') || l.includes('troisième'))
    return 'text-cyan-600 dark:text-cyan-400';
  return 'text-primary';
}
