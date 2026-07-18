import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { createDocumentRequest } from '@/testing/data-generators';
import { renderApp } from '@/testing/test-utils';

import { countQueueBuckets, QueueCounters } from '../queue-counters';

const documents = [
  createDocumentRequest({ id: '1', status: 'submitted' }),
  createDocumentRequest({ id: '2', status: 'submitted' }),
  createDocumentRequest({ id: '3', status: 'under_verification' }),
  createDocumentRequest({ id: '4', status: 'info_requested' }),
  createDocumentRequest({ id: '5', status: 'validated' }),
  createDocumentRequest({ id: '6', status: 'document_deposited' }),
];

describe('countQueueBuckets', () => {
  test('compte chaque étape de la file sur les demandes fournies', () => {
    const counts = countQueueBuckets(documents);

    expect(counts['']).toBe(6);
    expect(counts.submitted).toBe(2);
    expect(counts.under_verification).toBe(1);
    expect(counts.info_requested).toBe(1);
    expect(counts.validated).toBe(1);
  });

  test('renvoie zéro pour une étape sans demande', () => {
    expect(countQueueBuckets([]).submitted).toBe(0);
  });
});

describe('QueueCounters', () => {
  test('affiche la charge de chaque étape et sa portée (page courante)', () => {
    renderApp(
      <QueueCounters
        value=""
        onChange={vi.fn()}
        counts={countQueueBuckets(documents)}
        loadedCount={6}
        totalCount={42}
      />,
    );

    expect(
      screen.getByRole('button', { name: /2\s*à traiter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /1\s*à signer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/comptages établis sur les 6 demandes de cette page/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/42 au total/i)).toBeInTheDocument();
  });

  test('masque les chiffres — et l’explique — quand ils ne sont pas fiables', () => {
    renderApp(
      <QueueCounters value="submitted" onChange={vi.fn()} loadedCount={3} />,
    );

    // Pas de « 0 » trompeur sur les autres étapes : l'API ne fournit pas de
    // totaux par statut, « inconnu » ne doit pas se lire « aucune ».
    expect(
      screen.getByText(/les comptages par étape sont masqués/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'En vérification' }),
    ).toBeInTheDocument();
  });

  test('l’étape active est signalée comme pressée', () => {
    renderApp(
      <QueueCounters
        value="under_verification"
        onChange={vi.fn()}
        counts={countQueueBuckets(documents)}
        loadedCount={6}
      />,
    );

    expect(
      screen.getByRole('button', { name: /en vérification/i }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /toutes/i })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('cliquer un compteur filtre sur son étape', async () => {
    const onChange = vi.fn();
    renderApp(
      <QueueCounters
        value=""
        onChange={onChange}
        counts={countQueueBuckets(documents)}
        loadedCount={6}
      />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /attente fidèle/i }),
    );

    expect(onChange).toHaveBeenCalledWith('info_requested');
  });

  test('les demandes terminées restent accessibles via l’historique', async () => {
    const onChange = vi.fn();
    renderApp(<QueueCounters value="" onChange={onChange} loadedCount={0} />);

    await userEvent.click(screen.getByRole('button', { name: 'Déposées' }));
    expect(onChange).toHaveBeenCalledWith('document_deposited');

    await userEvent.click(screen.getByRole('button', { name: 'Rejetées' }));
    expect(onChange).toHaveBeenCalledWith('rejected');
  });
});
