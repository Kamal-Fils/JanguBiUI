import { normalizeReadingLabel } from '@/utils/reading-labels';

import type { Reading } from '../api/get-liturgy';

/** Libellé affichable, normalisé (« lecture1 » → « Première Lecture »). */
export function readingLabel(reading: Reading): string {
  return normalizeReadingLabel(reading.type ?? '') || 'Lecture';
}

/**
 * L'Évangile porte le jour : on l'identifie pour lui donner la primauté
 * visuelle (échelle, surface, filet), jamais pour le déplacer.
 */
export function isGospel(reading: Reading): boolean {
  return /[eé]vangile/i.test(readingLabel(reading));
}

/**
 * Lectures affichables, **dans l'ordre livré par l'AELF**.
 *
 * Cet ordre est liturgique (première lecture, psaume, deuxième lecture,
 * acclamation, Évangile) : on ne le retrie jamais — un missel qui réordonne
 * les lectures est faux. On écarte seulement les entrées sans aucun contenu,
 * qui n'ont rien à afficher.
 */
export function displayableReadings(
  readings: readonly Reading[] | undefined,
): Reading[] {
  return (readings ?? []).filter(
    (reading) =>
      (reading.text ?? '').trim().length > 0 ||
      (reading.citation ?? '').trim().length > 0,
  );
}

/** Ancre stable, pour que le sommaire mène directement à la lecture. */
export function readingAnchor(reading: Reading): string {
  return `lecture-${reading.id}`;
}
