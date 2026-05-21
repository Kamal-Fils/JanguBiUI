import { describe, expect, test } from 'vitest';

import {
  getReadingAccentClass,
  normalizeReadingLabel,
} from '../reading-labels';

describe('normalizeReadingLabel', () => {
  test('maps "lecture1" to "Première Lecture"', () => {
    expect(normalizeReadingLabel('lecture1')).toBe('Première Lecture');
  });

  test('maps "gospel" to "Évangile"', () => {
    expect(normalizeReadingLabel('gospel')).toBe('Évangile');
  });

  test('is case-insensitive ("PSAUME" → "Psaume")', () => {
    expect(normalizeReadingLabel('PSAUME')).toBe('Psaume');
  });

  test('passes through unknown labels unchanged', () => {
    expect(normalizeReadingLabel('custom type')).toBe('custom type');
  });

  test('maps "lecture2" to "Deuxième Lecture"', () => {
    expect(normalizeReadingLabel('lecture2')).toBe('Deuxième Lecture');
  });

  test('handles whitespace and other aliases', () => {
    expect(normalizeReadingLabel('  Lecture_1  ')).toBe('Première Lecture');
    expect(normalizeReadingLabel('evangile')).toBe('Évangile');
    expect(normalizeReadingLabel('Alleluia')).toBe('Alléluia');
  });
});

describe('getReadingAccentClass', () => {
  test('returns violet for Psaume', () => {
    expect(getReadingAccentClass('Psaume')).toContain('violet');
  });

  test('returns amber for Évangile', () => {
    expect(getReadingAccentClass('Évangile')).toContain('amber');
  });

  test('returns cyan for Deuxième Lecture', () => {
    expect(getReadingAccentClass('Deuxième Lecture')).toContain('cyan');
  });

  test('returns primary fallback for first reading', () => {
    expect(getReadingAccentClass('Première Lecture')).toBe('text-primary');
  });
});
