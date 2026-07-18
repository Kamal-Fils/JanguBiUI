import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import type { MassIntention } from '../../api/get-my-intentions';
import { ClergyIntentionList } from '../clergy-intention-list';

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

/**
 * Les actions par ligne vivent dans un menu « ⋯ » — on l'ouvre avant d'asserter.
 * La DataTable rend chaque ligne deux fois (table desktop + carte mobile,
 * départagées par CSS que jsdom n'applique pas) : on ouvre le premier menu.
 */
async function openRowActions(requestorEmail: string) {
  const [trigger] = await screen.findAllByRole('button', {
    name: `Actions pour l'intention de ${requestorEmail}`,
  });
  await userEvent.click(trigger);
}

describe('ClergyIntentionList', () => {
  test('liste vide → EmptyState incitatif', async () => {
    renderApp(<ClergyIntentionList intentions={[]} />);

    expect(
      await screen.findByText('Aucune intention à traiter'),
    ).toBeInTheDocument();
  });

  test('affiche demandeur, statut et texte de l’intention (double rendu DataTable)', async () => {
    renderApp(<ClergyIntentionList intentions={[makeIntention()]} />);

    expect(
      (await screen.findAllByText('fidele@jangubi.sn')).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('En attente').length).toBeGreaterThan(0);
    expect(
      screen.getAllByText("Pour le repos de l'âme de mon grand-père Joseph.")
        .length,
    ).toBeGreaterThan(0);
  });

  test('pending : le menu « ⋯ » propose Accepter et Refuser, pas Marquer célébrée', async () => {
    renderApp(
      <ClergyIntentionList intentions={[makeIntention({ status: 'pending' })]} />,
    );

    await openRowActions('fidele@jangubi.sn');

    expect(
      await screen.findByRole('menuitem', { name: 'Accepter' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Refuser' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Marquer célébrée' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Proposer une date' }),
    ).not.toBeInTheDocument();
  });

  test('accepter → POST accept + notification de succès', async () => {
    let called = false;
    server.use(
      http.post(`${env.API_URL}/v1/mass-intentions/1/accept/`, () => {
        called = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    renderApp(
      <ClergyIntentionList intentions={[makeIntention({ status: 'pending' })]} />,
    );

    await openRowActions('fidele@jangubi.sn');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Accepter' }),
    );

    expect(
      await screen.findByText('Intention acceptée'),
    ).toBeInTheDocument();
    expect(called).toBe(true);
  });

  test('accepted : Proposer une date → dialogue, confirmation → POST propose-date', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${env.API_URL}/v1/mass-intentions/1/propose-date/`,
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({}, { status: 200 });
        },
      ),
    );

    renderApp(
      <ClergyIntentionList
        intentions={[makeIntention({ status: 'accepted' })]}
      />,
    );

    await openRowActions('fidele@jangubi.sn');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Proposer une date' }),
    );

    // `selector: 'input'` — le dialogue lui-même est aussi « labellisé »
    // (aria-labelledby) par un titre contenant « date de célébration ».
    const dateInput = await screen.findByLabelText(/date de célébration/i, {
      selector: 'input',
    });
    fireEvent.change(dateInput, { target: { value: '2026-06-10' } });
    await userEvent.click(
      screen.getByRole('button', { name: 'Proposer cette date' }),
    );

    // On asserte le message (unique) — « Date proposée » existe aussi en
    // en-tête de colonne et comme libellé de badge.
    expect(
      await screen.findByText(
        'La date de célébration a été proposée au fidèle.',
      ),
    ).toBeInTheDocument();
    expect(body).toEqual({ proposed_date: '2026-06-10' });
  });

  test('date_proposed : seule action possible → Marquer célébrée (POST celebrate)', async () => {
    let called = false;
    server.use(
      http.post(`${env.API_URL}/v1/mass-intentions/1/celebrate/`, () => {
        called = true;
        return HttpResponse.json({}, { status: 200 });
      }),
    );

    renderApp(
      <ClergyIntentionList
        intentions={[makeIntention({ status: 'date_proposed' })]}
      />,
    );

    await openRowActions('fidele@jangubi.sn');

    // Conforme au backend : ni re-proposition de date, ni refus après proposition.
    expect(
      await screen.findByRole('menuitem', { name: 'Marquer célébrée' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Proposer une date' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('menuitem', { name: 'Refuser' }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('menuitem', { name: 'Marquer célébrée' }),
    );

    expect(await screen.findByText('Intention célébrée')).toBeInTheDocument();
    expect(called).toBe(true);
  });

  test('refuser → dialogue avec motif optionnel, confirmation → POST decline', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(
        `${env.API_URL}/v1/mass-intentions/1/decline/`,
        async ({ request }) => {
          body = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json({}, { status: 200 });
        },
      ),
    );

    renderApp(
      <ClergyIntentionList intentions={[makeIntention({ status: 'pending' })]} />,
    );

    await openRowActions('fidele@jangubi.sn');
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Refuser' }),
    );

    await userEvent.type(
      await screen.findByLabelText(/motif du refus/i),
      'Période indisponible.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Confirmer le refus' }),
    );

    expect(await screen.findByText('Refus enregistré')).toBeInTheDocument();
    expect(body).toEqual({ notes: 'Période indisponible.' });
  });

  test('statut terminal (celebrated) : aucun menu d’actions', async () => {
    renderApp(
      <ClergyIntentionList
        intentions={[makeIntention({ status: 'celebrated' })]}
      />,
    );

    expect(
      (await screen.findAllByText('fidele@jangubi.sn')).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', {
        name: "Actions pour l'intention de fidele@jangubi.sn",
      }),
    ).not.toBeInTheDocument();
  });
});
