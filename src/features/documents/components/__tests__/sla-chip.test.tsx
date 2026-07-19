import { screen } from '@testing-library/react';

import { createDocumentRequest } from '@/testing/data-generators';
import { renderApp } from '@/testing/test-utils';

import type { DocumentStatus } from '../../types';
import { compareByUrgency, SlaChip, getSlaState } from '../sla-chip';

/**
 * Le délai vient désormais du serveur : plus d'horloge ni de seuil côté client.
 * Les cas ci-dessous décrivent ce que l'API renvoie, pas ce qu'on recalcule.
 */
const doc = (
  status: DocumentStatus,
  sla_days: number | null,
  sla_threshold_days: number | null,
  is_escalated = false,
) => createDocumentRequest({ status, sla_days, sla_threshold_days, is_escalated });

describe('getSlaState — le serveur fait autorité', () => {
  test('dans les temps → ok ; veille du seuil → due ; seuil atteint → late', () => {
    expect(getSlaState(doc('submitted', 2, 7)).kind).toBe('ok');
    expect(getSlaState(doc('submitted', 6, 7)).kind).toBe('due');
    expect(getSlaState(doc('submitted', 7, 7, true)).kind).toBe('late');
  });

  test('suit le seuil propre au statut, pas une valeur unique', () => {
    // Une demande validée est relancée dès 3 jours : 4 jours = en retard,
    // alors que le même âge serait « dans les temps » avec un seuil de 7.
    expect(getSlaState(doc('validated', 4, 3, true)).kind).toBe('late');
    expect(getSlaState(doc('submitted', 4, 7)).kind).toBe('ok');
  });

  test('fait confiance au drapeau d’escalade du serveur', () => {
    expect(getSlaState(doc('submitted', 5, 7, true)).kind).toBe('late');
  });

  test('demande en attente du fidèle → en veille, jamais d’alerte', () => {
    expect(getSlaState(doc('info_requested', 40, 5, true)).kind).toBe('dormant');
  });

  test('demande terminale → clôturée', () => {
    expect(getSlaState(doc('document_deposited', null, null)).kind).toBe('closed');
    expect(getSlaState(doc('rejected', null, null)).kind).toBe('closed');
  });

  test('sans délai serveur → état neutre, aucun seuil inventé', () => {
    const sansDonnee = createDocumentRequest({ status: 'submitted' });
    delete (sansDonnee as Record<string, unknown>).sla_days;
    delete (sansDonnee as Record<string, unknown>).sla_threshold_days;

    expect(getSlaState(sansDonnee).kind).toBe('unknown');
  });
});

describe('compareByUrgency', () => {
  test('le plus ancien d’abord, puis les demandes en veille, puis les clôturées', () => {
    const recente = doc('submitted', 1, 7);
    const ancienne = doc('submitted', 9, 7, true);
    const enVeille = doc('info_requested', 30, 5);
    const close = doc('document_deposited', null, null);

    const ordre = [close, enVeille, recente, ancienne].sort(compareByUrgency);

    expect(ordre).toEqual([ancienne, recente, enVeille, close]);
  });
});

describe('SlaChip', () => {
  test('annonce le retard avec le seuil réellement appliqué', () => {
    renderApp(<SlaChip document={doc('validated', 4, 3, true)} />);

    expect(screen.getByText('J+4 · en retard')).toBeInTheDocument();
  });

  test('annonce la veille du seuil', () => {
    renderApp(<SlaChip document={doc('submitted', 6, 7)} />);

    expect(screen.getByText('J+6 · seuil J+7')).toBeInTheDocument();
  });

  test('met en veille une demande qui attend le fidèle', () => {
    renderApp(<SlaChip document={doc('info_requested', 12, 5, true)} />);

    expect(screen.getByText('En attente du fidèle')).toBeInTheDocument();
  });

  test('reste neutre quand le serveur ne fournit pas de délai', () => {
    const sansDonnee = createDocumentRequest({ status: 'submitted' });
    delete (sansDonnee as Record<string, unknown>).sla_days;
    delete (sansDonnee as Record<string, unknown>).sla_threshold_days;

    renderApp(<SlaChip document={sansDonnee} />);

    expect(screen.getByText('Délai indisponible')).toBeInTheDocument();
  });
});
