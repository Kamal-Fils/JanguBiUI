import { screen } from '@testing-library/react';

import { renderApp } from '@/testing/test-utils';

import type { MassIntention } from '../../api/get-my-intentions';
import { MassIntentionCard } from '../mass-intention-card';

function makeIntention(overrides: Partial<MassIntention> = {}): MassIntention {
  return {
    id: 1,
    intention_type: 'for_deceased',
    intention_text: "Pour le repos de l'âme de mon grand-père Joseph.",
    status: 'pending',
    requestor_email: 'fidele@jangubi.sn',
    pretre_email: null,
    parish_name: 'Paroisse Saint-Joseph de Médina',
    proposed_date: null,
    celebration_date: null,
    notes: '',
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-06-01T08:00:00Z',
    ...overrides,
  };
}

describe('MassIntentionCard', () => {
  test('affiche le texte, le type et le badge de statut', () => {
    renderApp(<MassIntentionCard intention={makeIntention()} />);

    expect(
      screen.getByText("Pour le repos de l'âme de mon grand-père Joseph."),
    ).toBeInTheDocument();
    // Surtitre : type + date de création formatée en français.
    expect(screen.getByText(/Pour un défunt/)).toBeInTheDocument();
    expect(screen.getByText(/1 juin 2026/)).toBeInTheDocument();
    // Statut porté par le badge (couleur + icône + libellé).
    expect(screen.getByText('En attente')).toBeInTheDocument();
  });

  test('chaque statut du workflow a son libellé français', () => {
    const { rerender } = renderApp(
      <MassIntentionCard intention={makeIntention({ status: 'date_proposed' })} />,
    );
    expect(screen.getByText('Date proposée')).toBeInTheDocument();

    rerender(
      <MassIntentionCard intention={makeIntention({ status: 'celebrated' })} />,
    );
    expect(screen.getByText('Célébrée')).toBeInTheDocument();

    rerender(
      <MassIntentionCard intention={makeIntention({ status: 'declined' })} />,
    );
    expect(screen.getByText('Refusée')).toBeInTheDocument();
  });

  test('vue clergé (showRequester) : demandeur et paroisse affichés', () => {
    renderApp(
      <MassIntentionCard intention={makeIntention()} showRequester />,
    );

    expect(screen.getByText('fidele@jangubi.sn')).toBeInTheDocument();
    expect(
      screen.getByText('Paroisse Saint-Joseph de Médina'),
    ).toBeInTheDocument();
  });

  test('affiche la date proposée et la date de célébration quand présentes', () => {
    renderApp(
      <MassIntentionCard
        intention={makeIntention({
          status: 'celebrated',
          proposed_date: '2026-06-10',
          celebration_date: '2026-06-10',
        })}
      />,
    );

    expect(screen.getByText('Date proposée')).toBeInTheDocument();
    expect(screen.getByText('Célébrée le')).toBeInTheDocument();
    expect(screen.getAllByText('10 juin 2026').length).toBe(2);
  });
});
