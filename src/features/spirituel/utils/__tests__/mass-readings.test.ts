import type { Reading } from '../../api/get-liturgy';
import {
  displayableReadings,
  isGospel,
  readingAnchor,
  readingLabel,
} from '../mass-readings';

const reading = (overrides: Partial<Reading> & { id: number }): Reading => ({
  type: 'lecture1',
  citation: 'Is 55, 10-11',
  text: '<p>Comme la pluie</p>',
  ...overrides,
});

describe('readingLabel', () => {
  it('normalise les libellés techniques du backend', () => {
    expect(readingLabel(reading({ id: 1, type: 'lecture1' }))).toBe(
      'Première Lecture',
    );
    expect(readingLabel(reading({ id: 2, type: 'evangile' }))).toBe('Évangile');
  });

  it('retombe sur « Lecture » quand le type est absent', () => {
    expect(readingLabel(reading({ id: 3, type: null }))).toBe('Lecture');
  });
});

describe('isGospel', () => {
  it('reconnaît l’Évangile quelle que soit l’orthographe du backend', () => {
    expect(isGospel(reading({ id: 1, type: 'evangile' }))).toBe(true);
    expect(isGospel(reading({ id: 2, type: 'gospel' }))).toBe(true);
    expect(isGospel(reading({ id: 3, type: 'Évangile' }))).toBe(true);
  });

  it('ne confond pas une lecture ordinaire avec l’Évangile', () => {
    expect(isGospel(reading({ id: 4, type: 'psaume' }))).toBe(false);
    expect(isGospel(reading({ id: 5, type: 'lecture2' }))).toBe(false);
  });
});

describe('displayableReadings', () => {
  it('préserve l’ordre liturgique livré par l’AELF', () => {
    // Arrange — l'ordre reçu est déjà canonique : on ne doit jamais le retrier.
    const readings = [
      reading({ id: 1, type: 'lecture1' }),
      reading({ id: 2, type: 'psaume' }),
      reading({ id: 3, type: 'alleluia' }),
      reading({ id: 4, type: 'evangile' }),
    ];

    // Act
    const result = displayableReadings(readings);

    // Assert
    expect(result.map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it('écarte les lectures sans texte ni citation', () => {
    const result = displayableReadings([
      reading({ id: 1 }),
      reading({ id: 2, text: '   ', citation: '  ' }),
      reading({ id: 3, text: '', citation: 'Jn 3, 16' }),
    ]);

    expect(result.map((item) => item.id)).toEqual([1, 3]);
  });

  it('tolère une réponse absente', () => {
    expect(displayableReadings(undefined)).toEqual([]);
  });
});

describe('readingAnchor', () => {
  it('produit une ancre stable pour le sommaire', () => {
    expect(readingAnchor(reading({ id: 42 }))).toBe('lecture-42');
  });
});
