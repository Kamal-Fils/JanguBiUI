import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { MassIntention } from '../../api/get-my-intentions';
import { IntentionFideleActions } from '../intention-fidele-actions';

function makeIntention(overrides: Partial<MassIntention> = {}): MassIntention {
  return {
    id: 1,
    reference: 'INT-20260601-A1B2C3D4',
    intention_type: 'for_deceased',
    intention_text: "Pour le repos de l'âme de mon grand-père Joseph.",
    status: 'pending',
    requestor_email: 'fidele@jangubi.sn',
    pretre_email: null,
    parish_name: 'Paroisse Saint-Joseph de Médina',
    proposed_date: null,
    celebration_date: null,
    receipt_url: null,
    notes: '',
    created_at: '2026-06-01T08:00:00Z',
    updated_at: '2026-06-01T08:00:00Z',
    ...overrides,
  };
}

describe('IntentionFideleActions', () => {
  test('aucune action proposée tant que ce n’est pas au fidèle de jouer', () => {
    renderApp(
      <IntentionFideleActions intention={makeIntention({ status: 'pending' })} />,
    );

    // Un bouton qui garantirait un 400 côté serveur est un piège : on n'en rend aucun.
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('aucune action en statut « acceptée » (la balle est dans le camp de la paroisse)', () => {
    renderApp(
      <IntentionFideleActions
        intention={makeIntention({ status: 'accepted' })}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('date proposée → le fidèle voit la date et peut la confirmer', async () => {
    renderApp(
      <IntentionFideleActions
        intention={makeIntention({
          status: 'date_proposed',
          proposed_date: '2026-09-12',
        })}
      />,
    );

    expect(screen.getByText(/12 septembre 2026/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Confirmer cette date/i }),
    ).toBeInTheDocument();
  });

  test('confirmation réussie → notification de succès', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/mass-intentions/1/confirm-date/`, () =>
        HttpResponse.json({ id: 1, status: 'confirmed' }),
      ),
    );
    renderApp(
      <IntentionFideleActions
        intention={makeIntention({
          status: 'date_proposed',
          proposed_date: '2026-09-12',
        })}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Confirmer cette date/i }),
    );

    expect(await screen.findByText('Date confirmée')).toBeInTheDocument();
  });

  test('confirmation en échec → message d’erreur VISIBLE (pas d’échec silencieux)', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/mass-intentions/1/confirm-date/`, () =>
        HttpResponse.json({ detail: 'Statut invalide.' }, { status: 400 }),
      ),
    );
    renderApp(
      <IntentionFideleActions
        intention={makeIntention({
          status: 'date_proposed',
          proposed_date: '2026-09-12',
        })}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Confirmer cette date/i }),
    );

    // `api-client` émet aussi un toast global (role="alert") : on cible
    // explicitement le message inline, persistant à côté du bouton à réessayer.
    expect(
      await screen.findByText(/La confirmation n'a pas pu être enregistrée/i),
    ).toBeInTheDocument();
  });

  test('intention célébrée avec reçu → lien de téléchargement direct', () => {
    renderApp(
      <IntentionFideleActions
        intention={makeIntention({
          status: 'celebrated',
          celebration_date: '2026-09-12',
          receipt_url: 'https://files.jangubi.sn/recu_INT-20260601-A1B2C3D4.pdf',
        })}
      />,
    );

    const link = screen.getByRole('link', { name: /Télécharger le reçu/i });
    expect(link).toHaveAttribute(
      'href',
      'https://files.jangubi.sn/recu_INT-20260601-A1B2C3D4.pdf',
    );
  });

  test('célébrée sans reçu encore émis → repli qui le régénère à la demande', async () => {
    const openSpy = vi
      .spyOn(window, 'open')
      .mockImplementation(() => null as unknown as Window);
    server.use(
      http.get(`${env.API_URL}/v1/mass-intentions/1/receipt/`, () =>
        HttpResponse.json({
          reference: 'INT-20260601-A1B2C3D4',
          receipt_url: 'https://files.jangubi.sn/recu.pdf',
          celebration_date: '2026-09-12',
        }),
      ),
    );
    renderApp(
      <IntentionFideleActions
        intention={makeIntention({
          status: 'celebrated',
          celebration_date: '2026-09-12',
          receipt_url: null,
        })}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Obtenir mon reçu/i }),
    );

    await waitFor(() =>
      expect(openSpy).toHaveBeenCalledWith(
        'https://files.jangubi.sn/recu.pdf',
        '_blank',
        'noopener,noreferrer',
      ),
    );
    openSpy.mockRestore();
  });

  test('récupération du reçu en échec → message d’erreur visible', async () => {
    server.use(
      http.get(`${env.API_URL}/v1/mass-intentions/1/receipt/`, () =>
        HttpResponse.json({ detail: 'Indisponible.' }, { status: 400 }),
      ),
    );
    renderApp(
      <IntentionFideleActions
        intention={makeIntention({
          status: 'celebrated',
          receipt_url: null,
        })}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /Obtenir mon reçu/i }),
    );

    expect(
      await screen.findByText(/Le reçu n’a pas pu être récupéré/i),
    ).toBeInTheDocument();
  });
});
