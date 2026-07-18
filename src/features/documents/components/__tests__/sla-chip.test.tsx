import { screen } from '@testing-library/react';

import { createDocumentRequest } from '@/testing/data-generators';
import { renderApp } from '@/testing/test-utils';

import {
  compareByUrgency,
  getDocumentAgeDays,
  SLA_ESCALATE_DAYS,
  SlaChip,
  getSlaState,
} from '../sla-chip';

/** Horloge figée : les seuils SLA ne doivent jamais dépendre du jour du test. */
const NOW = new Date('2026-07-18T12:00:00Z');

/** Date de création située `days` jours avant `NOW`. */
const daysAgo = (days: number): string =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

describe('getDocumentAgeDays', () => {
  test('compte les jours pleins écoulés depuis la réception', () => {
    expect(getDocumentAgeDays(daysAgo(0), NOW)).toBe(0);
    expect(getDocumentAgeDays(daysAgo(3), NOW)).toBe(3);
    expect(getDocumentAgeDays(daysAgo(16), NOW)).toBe(16);
  });

  test('ne renvoie jamais d’âge négatif ni NaN sur une date illisible', () => {
    expect(getDocumentAgeDays(daysAgo(-5), NOW)).toBe(0);
    expect(getDocumentAgeDays('pas-une-date', NOW)).toBe(0);
  });
});

describe('getSlaState — seuil aligné sur DOCS_ESCALATE_DAYS', () => {
  test('le seuil front vaut 7 jours, comme le réglage backend par défaut', () => {
    expect(SLA_ESCALATE_DAYS).toBe(7);
  });

  test('dans les temps → ok ; veille du seuil → due ; seuil atteint → late', () => {
    const at = (days: number) =>
      getSlaState({ status: 'submitted', created_at: daysAgo(days) }, NOW).kind;

    expect(at(1)).toBe('ok');
    expect(at(SLA_ESCALATE_DAYS - 2)).toBe('ok');
    expect(at(SLA_ESCALATE_DAYS - 1)).toBe('due');
    expect(at(SLA_ESCALATE_DAYS)).toBe('late');
    expect(at(SLA_ESCALATE_DAYS + 9)).toBe('late');
  });

  test('une demande en attente du fidèle est en veille, jamais en retard', () => {
    // 16 jours : largement au-delà du seuil — mais la balle est côté fidèle.
    const state = getSlaState(
      { status: 'info_requested', created_at: daysAgo(16) },
      NOW,
    );

    expect(state.kind).toBe('dormant');
    expect(state.ageDays).toBe(16);
  });

  test('une demande terminale sort de la file (clôturée)', () => {
    expect(
      getSlaState(
        { status: 'document_deposited', created_at: daysAgo(30) },
        NOW,
      ).kind,
    ).toBe('closed');
    expect(
      getSlaState({ status: 'rejected', created_at: daysAgo(30) }, NOW).kind,
    ).toBe('closed');
  });
});

describe('SlaChip — rendu', () => {
  test('affiche l’ancienneté en vert quand la demande est dans les temps', () => {
    renderApp(<SlaChip status="submitted" createdAt={daysAgo(1)} now={NOW} />);

    const chip = screen.getByText('J+1');
    expect(chip).toHaveClass('text-success');
  });

  test('passe en orange à la veille du seuil, en rappelant le seuil', () => {
    renderApp(<SlaChip status="submitted" createdAt={daysAgo(6)} now={NOW} />);

    const chip = screen.getByText('J+6 · seuil J+7');
    expect(chip).toHaveClass('text-warning');
  });

  test('passe en rouge et annonce le retard au-delà du seuil', () => {
    renderApp(
      <SlaChip status="under_verification" createdAt={daysAgo(16)} now={NOW} />,
    );

    const chip = screen.getByText('J+16 · en retard');
    expect(chip).toHaveClass('text-destructive');
  });

  test('neutralise l’alerte pour une demande en attente du fidèle', () => {
    renderApp(
      <SlaChip status="info_requested" createdAt={daysAgo(16)} now={NOW} />,
    );

    const chip = screen.getByText('En attente du fidèle');
    expect(chip).toHaveClass('text-muted-foreground');
    expect(chip).not.toHaveClass('text-destructive');
    expect(screen.queryByText(/en retard/i)).not.toBeInTheDocument();
  });
});

describe('compareByUrgency — ordre de la file', () => {
  test('trie les demandes actives de la plus ancienne à la plus récente', () => {
    const recent = createDocumentRequest({
      id: 'recent',
      status: 'submitted',
      created_at: daysAgo(1),
    });
    const old = createDocumentRequest({
      id: 'old',
      status: 'submitted',
      created_at: daysAgo(16),
    });

    expect([recent, old].sort((a, b) => compareByUrgency(a, b, NOW))).toEqual([
      old,
      recent,
    ]);
  });

  test('relègue les demandes en veille puis clôturées après les demandes actives', () => {
    const dormant = createDocumentRequest({
      id: 'dormant',
      status: 'info_requested',
      created_at: daysAgo(30),
    });
    const closed = createDocumentRequest({
      id: 'closed',
      status: 'document_deposited',
      created_at: daysAgo(40),
    });
    const active = createDocumentRequest({
      id: 'active',
      status: 'submitted',
      created_at: daysAgo(1),
    });

    const ordered = [closed, dormant, active]
      .sort((a, b) => compareByUrgency(a, b, NOW))
      .map((doc) => doc.id);

    expect(ordered).toEqual(['active', 'dormant', 'closed']);
  });
});
