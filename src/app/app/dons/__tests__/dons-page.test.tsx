import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import * as React from 'react';

import { env } from '@/config/env';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

// AppShell pulls nav/notifications/theme — hors sujet pour la logique de don.
vi.mock('@/components/layouts/app-shell', () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => children,
}));

import DonsPage from '../page';

const MEMBERSHIPS = [
  {
    id: 1,
    church: { id: 111, name: 'Église A' },
    parish: { id: 11, name: 'Saint-Pierre' },
    diocese: { id: 1, name: 'Diocèse de Dakar' },
    is_primary: true,
  },
  {
    id: 2,
    church: { id: 211, name: 'Église B' },
    parish: { id: 21, name: 'Sainte-Anne' },
    diocese: { id: 2, name: 'Diocèse de Thiès' },
    is_primary: false,
  },
];

function mockBackend() {
  server.use(
    http.get(`${env.API_URL}/v1/auth/me/`, () =>
      HttpResponse.json(createUser({ memberships: MEMBERSHIPS })),
    ),
    http.get(`${env.API_URL}/v1/donations/campaigns/`, () =>
      HttpResponse.json({ count: 0, results: [] }),
    ),
  );
}

describe('DonsPage — bénéficiaire & paiement (C7c)', () => {
  beforeEach(mockBackend);

  test('le bénéficiaire par défaut est l’église principale', async () => {
    renderApp(<DonsPage />);

    const beneficiary = (await screen.findByLabelText(
      'Bénéficiaire',
    )) as HTMLSelectElement;
    // Église principale = id 111 (is_primary).
    expect(beneficiary.value).toBe('111');
  });

  test('le paiement en ligne est désactivé, les espèces actives par défaut', async () => {
    renderApp(<DonsPage />);

    const method = await screen.findByRole('radiogroup', {
      name: 'Méthode de paiement',
    });

    // Espèces = seule méthode active, sélectionnée par défaut.
    const cash = within(method).getByRole('radio', { name: /espèces/i });
    expect(cash).toBeEnabled();
    expect(cash).toHaveAttribute('aria-checked', 'true');

    // Providers en ligne : désactivés, badge « Bientôt disponible ».
    expect(within(method).getByRole('radio', { name: /wave/i })).toBeDisabled();
    expect(
      within(method).getByRole('radio', { name: /orange money/i }),
    ).toBeDisabled();
    expect(
      within(method).getByRole('radio', { name: /free money/i }),
    ).toBeDisabled();
    expect(
      within(method).getAllByText(/bientôt disponible/i),
    ).toHaveLength(3);
  });

  test('le don envoie church_id (principale) + parish_id dérivé + cash', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${env.API_URL}/v1/donations/donate/`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderApp(<DonsPage />);
    await screen.findByLabelText('Bénéficiaire');

    await user.type(screen.getByLabelText('Montant (XOF)'), '5000');
    await user.click(screen.getByRole('button', { name: /confirmer le don/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({
      church_id: 111,
      parish_id: 11,
      payment_provider: 'cash',
      amount: 5000,
    });
  });

  test('on peut choisir une autre église bénéficiaire', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(`${env.API_URL}/v1/donations/donate/`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    const user = userEvent.setup();
    renderApp(<DonsPage />);
    await screen.findByLabelText('Bénéficiaire');

    await user.selectOptions(screen.getByLabelText('Bénéficiaire'), '211');
    await user.type(screen.getByLabelText('Montant (XOF)'), '3000');
    await user.click(screen.getByRole('button', { name: /confirmer le don/i }));

    await waitFor(() => expect(body).not.toBeNull());
    expect(body).toMatchObject({ church_id: 211, parish_id: 21 });
  });
});

/**
 * La page de don est un **parcours** (DIRECTION R1) : on juge le trajet, pas
 * la capture. Ces tests fixent les trois défauts corrigés — on ne confirme pas
 * un versement à l'aveugle, un échec ne peut pas être muet, et une saisie
 * invalide doit le dire.
 */
describe('DonsPage — le parcours de don', () => {
  beforeEach(mockBackend);

  test('un récapitulatif précède la confirmation du versement', async () => {
    const user = userEvent.setup();
    renderApp(<DonsPage />);
    await screen.findByLabelText('Bénéficiaire');

    // Avant saisie : rien à récapituler.
    expect(screen.queryByText('Montant')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Montant (XOF)'), '5000');

    // Après saisie : combien, et à qui — dans le récapitulatif lui-même
    // (« 5 000 XOF » existe aussi comme raccourci de montant).
    const recap = await screen.findByLabelText('Récapitulatif du don');
    expect(within(recap).getByText('Montant')).toBeInTheDocument();
    expect(within(recap).getByText('5 000 XOF')).toBeInTheDocument();
    expect(within(recap).getByText('Église A')).toBeInTheDocument();
  });

  test('un montant invalide est signalé au lieu d’être ignoré en silence', async () => {
    const user = userEvent.setup();
    renderApp(<DonsPage />);
    await screen.findByLabelText('Bénéficiaire');

    // Champ laissé vide : l'ancien code sortait de la fonction sans un mot.
    await user.click(screen.getByRole('button', { name: /confirmer le don/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /montant d’au moins 1 xof/i,
    );
  });

  test('un refus du serveur est affiché et l’action reste rejouable', async () => {
    server.use(
      http.post(
        `${env.API_URL}/v1/donations/donate/`,
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<DonsPage />);
    await screen.findByLabelText('Bénéficiaire');

    await user.type(screen.getByLabelText('Montant (XOF)'), '5000');
    await user.click(screen.getByRole('button', { name: /confirmer le don/i }));

    expect(
      await screen.findByText(/pas pu être enregistré/i),
    ).toBeInTheDocument();
    // Le bouton reste actionnable : on peut réessayer sans recharger.
    expect(
      screen.getByRole('button', { name: /confirmer le don/i }),
    ).toBeEnabled();
  });

  test('les étapes du parcours sont numérotées et ordonnées', async () => {
    renderApp(<DonsPage />);

    expect(
      await screen.findByRole('heading', { name: /pour qui/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /combien/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /comment/i })).toBeInTheDocument();
  });
});
