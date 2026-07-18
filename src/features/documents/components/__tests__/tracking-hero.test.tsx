import { screen, within } from '@testing-library/react';

import { renderApp } from '@/testing/test-utils';

import type { DocumentRequestDetail } from '../../types';
import { TrackingHero } from '../tracking-hero';

function makeDocument(
  overrides: Partial<DocumentRequestDetail> = {},
): DocumentRequestDetail {
  return {
    id: '1',
    document_type: 'baptism',
    status: 'submitted',
    notes: null,
    parish_name: 'Paroisse Sainte-Anne de Bel-Air',
    created_at: '2026-06-25T09:12:00Z',
    updated_at: '2026-06-25T09:12:00Z',
    ...overrides,
  };
}

describe('TrackingHero', () => {
  test('parcours en cours : libellé de statut, récit et jauge sur 4 étapes', () => {
    renderApp(
      <TrackingHero document={makeDocument({ status: 'submitted' })} />,
    );

    const hero = screen.getByRole('region', { name: 'État de la demande' });
    // Le libellé vient de DOCUMENT_STATUS_CONFIG (source unique).
    expect(within(hero).getByText('Soumis')).toBeInTheDocument();
    expect(
      within(hero).getByText('Votre demande est enregistrée'),
    ).toBeInTheDocument();
    expect(
      within(hero).getByText('Étape 1 sur 4 — Réception de votre demande'),
    ).toBeInTheDocument();
  });

  test('info_requested : la jauge reste au palier de vérification (2 sur 4)', () => {
    renderApp(
      <TrackingHero document={makeDocument({ status: 'info_requested' })} />,
    );

    const hero = screen.getByRole('region', { name: 'État de la demande' });
    expect(
      within(hero).getByText('Votre paroisse attend une précision'),
    ).toBeInTheDocument();
    expect(
      within(hero).getByText(/Étape 2 sur 4 — Vérification au registre/),
    ).toBeInTheDocument();
  });

  test('validated : palier 3 sur 4, signature du curé', () => {
    renderApp(
      <TrackingHero document={makeDocument({ status: 'validated' })} />,
    );

    const hero = screen.getByRole('region', { name: 'État de la demande' });
    expect(
      within(hero).getByText(/Étape 3 sur 4 — Validation et signature du curé/),
    ).toBeInTheDocument();
  });

  test('document_deposited : ton succès, téléchargement direct et coffre-fort', () => {
    renderApp(
      <TrackingHero
        document={makeDocument({
          status: 'document_deposited',
          attachments: [
            {
              id: 1,
              attachment_type: 'requester_proof',
              file_url: 'https://files.example/justificatif.pdf',
              created_at: '2026-06-25T09:12:00Z',
            },
            {
              id: 2,
              attachment_type: 'parish_final',
              file_url: 'https://files.example/certificat.pdf',
              created_at: '2026-07-30T09:00:00Z',
            },
          ],
          status_logs: [
            {
              to_status: 'document_deposited',
              created_at: '2026-07-30T09:00:00Z',
              comment: null,
            },
          ],
        })}
      />,
    );

    const hero = screen.getByRole('region', { name: 'État de la demande' });
    expect(
      within(hero).getByText('Votre document est prêt'),
    ).toBeInTheDocument();
    expect(
      within(hero).getByText(/Paroisse Sainte-Anne de Bel-Air/),
    ).toBeInTheDocument();

    // Le document final de la paroisse prime sur le justificatif du demandeur.
    expect(
      within(hero).getByRole('link', { name: /télécharger le document/i }),
    ).toHaveAttribute('href', 'https://files.example/certificat.pdf');
    expect(
      within(hero).getByRole('link', { name: /ouvrir le coffre-fort/i }),
    ).toHaveAttribute('href', '/app/documents');

    // Statut terminal : pas de jauge de progression.
    expect(within(hero).queryByText(/Étape \d sur 4/)).not.toBeInTheDocument();
  });

  test('document_deposited sans pièce jointe : pas de CTA téléchargement', () => {
    renderApp(
      <TrackingHero
        document={makeDocument({ status: 'document_deposited' })}
      />,
    );

    const hero = screen.getByRole('region', { name: 'État de la demande' });
    expect(
      within(hero).queryByRole('link', { name: /télécharger/i }),
    ).not.toBeInTheDocument();
    expect(
      within(hero).getByRole('link', { name: /ouvrir le coffre-fort/i }),
    ).toBeInTheDocument();
  });

  test('rejected : ton destructive, motif et rebond « refaire une demande »', () => {
    renderApp(
      <TrackingHero
        document={makeDocument({
          status: 'rejected',
          rejection_reason: 'Aucune trace de l’acte dans nos registres.',
        })}
      />,
    );

    const hero = screen.getByRole('region', { name: 'État de la demande' });
    expect(within(hero).getByText('Refusé')).toBeInTheDocument();
    expect(within(hero).getByText('Motif du refus')).toBeInTheDocument();
    expect(
      within(hero).getByText('Aucune trace de l’acte dans nos registres.'),
    ).toBeInTheDocument();
    expect(
      within(hero).getByRole('link', { name: /refaire une demande/i }),
    ).toHaveAttribute('href', '/app/documents/new');
  });

  test('rejected sans motif : message de repli, jamais de champ vide', () => {
    renderApp(<TrackingHero document={makeDocument({ status: 'rejected' })} />);

    const hero = screen.getByRole('region', { name: 'État de la demande' });
    expect(
      within(hero).getByText(/Aucun motif n’a été précisé par la paroisse/),
    ).toBeInTheDocument();
  });
});
