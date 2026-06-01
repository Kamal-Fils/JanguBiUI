import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, within } from '@/testing/test-utils';

import {
  ChurchCascadeSelector,
  type SelectedChurch,
} from '../church-cascade-selector';

// Radix Select a besoin de ces stubs sous jsdom.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // @ts-expect-error jsdom n'implémente pas ces méthodes pointer.
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  // @ts-expect-error idem
  Element.prototype.releasePointerCapture = vi.fn();
});

const DIOCESES = [
  { id: 1, name: 'Diocèse de Dakar', code: 'DK', province_id: 1 },
  { id: 2, name: 'Diocèse de Thiès', code: 'TH', province_id: 1 },
];
const PARISHES: Record<string, unknown[]> = {
  '1': [{ id: 11, name: 'Saint-Pierre', city: 'Dakar', address: '', diocese_id: 1 }],
  '2': [{ id: 21, name: 'Sainte-Anne', city: 'Thiès', address: '', diocese_id: 2 }],
};
const CHURCHES: Record<string, unknown[]> = {
  '11': [{ id: 111, name: 'Église A', is_main: true, city: 'Dakar', is_active: true, parish: 11, parish_name: 'Saint-Pierre' }],
  '21': [{ id: 211, name: 'Église B', is_main: true, city: 'Thiès', is_active: true, parish: 21, parish_name: 'Sainte-Anne' }],
};

const cascadeHandlers = [
  http.get(`${env.API_URL}/v1/org/dioceses/`, () =>
    HttpResponse.json({ results: DIOCESES }),
  ),
  http.get(`${env.API_URL}/v1/org/parishes/`, ({ request }) => {
    const d = new URL(request.url).searchParams.get('diocese') ?? '';
    return HttpResponse.json({ results: PARISHES[d] ?? [] });
  }),
  http.get(`${env.API_URL}/v1/org/churches/`, ({ request }) => {
    const p = new URL(request.url).searchParams.get('parish') ?? '';
    return HttpResponse.json({ results: CHURCHES[p] ?? [] });
  }),
];

function Harness() {
  const [selected, setSelected] = useState<SelectedChurch[]>([]);
  const [primary, setPrimary] = useState<number | null>(null);
  return (
    <ChurchCascadeSelector
      selected={selected}
      primaryChurchId={primary}
      onChange={(next, nextPrimary) => {
        setSelected(next);
        setPrimary(nextPrimary);
      }}
    />
  );
}

async function pickOption(comboboxLabel: string, optionName: RegExp) {
  await userEvent.click(screen.getByLabelText(comboboxLabel));
  await userEvent.click(await screen.findByRole('option', { name: optionName }));
}

async function addChurch(diocese: RegExp, parish: RegExp, church: RegExp) {
  await pickOption('Diocèse', diocese);
  await pickOption('Paroisse', parish);
  await pickOption('Église', church);
  await userEvent.click(
    screen.getByRole('button', { name: /ajouter cette église/i }),
  );
}

describe('ChurchCascadeSelector', () => {
  beforeEach(() => server.use(...cascadeHandlers));

  test('ajoute plusieurs églises de paroisses/diocèses différents', async () => {
    renderApp(<Harness />);

    await addChurch(/Dakar/, /Saint-Pierre/, /Église A/);
    await addChurch(/Thiès/, /Sainte-Anne/, /Église B/);

    const list = screen.getByRole('list', { name: /églises sélectionnées/i });
    expect(within(list).getByText(/Église A/)).toBeInTheDocument();
    expect(within(list).getByText(/Église B/)).toBeInTheDocument();
  });

  test('la 1re église ajoutée est la principale par défaut', async () => {
    renderApp(<Harness />);

    await addChurch(/Dakar/, /Saint-Pierre/, /Église A/);
    await addChurch(/Thiès/, /Sainte-Anne/, /Église B/);

    const list = screen.getByRole('list', { name: /églises sélectionnées/i });
    const itemA = within(list)
      .getByText(/Église A/)
      .closest('li') as HTMLElement;
    const itemB = within(list)
      .getByText(/Église B/)
      .closest('li') as HTMLElement;
    // A (1re ajoutée) = principale ; B = bouton « Définir principale ».
    expect(within(itemA).getByText('Principale')).toBeInTheDocument();
    expect(
      within(itemB).getByRole('button', { name: /définir principale/i }),
    ).toBeInTheDocument();
  });

  test('on peut changer la principale', async () => {
    renderApp(<Harness />);

    await addChurch(/Dakar/, /Saint-Pierre/, /Église A/);
    await addChurch(/Thiès/, /Sainte-Anne/, /Église B/);

    const list = screen.getByRole('list', { name: /églises sélectionnées/i });
    const itemB = within(list)
      .getByText(/Église B/)
      .closest('li') as HTMLElement;
    await userEvent.click(
      within(itemB).getByRole('button', { name: /définir principale/i }),
    );

    expect(within(itemB).getByText('Principale')).toBeInTheDocument();
  });
});
