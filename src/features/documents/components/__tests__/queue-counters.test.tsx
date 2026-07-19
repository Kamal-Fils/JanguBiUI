import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderApp } from '@/testing/test-utils';

import { QueueCounters, type QueueCounts } from '../queue-counters';

/**
 * Les comptages viennent du serveur, calculés sur tout le périmètre d'autorité
 * (endpoint dédié). Le composant ne compte plus rien lui-même : il affiche ce
 * qu'on lui donne, ou rien du tout.
 */
const counts: QueueCounts = {
  '': 42,
  submitted: 12,
  under_verification: 7,
  info_requested: 4,
  validated: 3,
};

describe('QueueCounters', () => {
  test('affiche la charge réelle de chaque étape', () => {
    renderApp(
      <QueueCounters
        value=""
        onChange={vi.fn()}
        counts={counts}
        totalCount={42}
      />,
    );

    expect(
      screen.getByRole('button', { name: /12\s*à traiter/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /3\s*à signer/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/42 demandes sur votre périmètre/i),
    ).toBeInTheDocument();
  });

  test('les chiffres restent affichés quand un filtre est actif', () => {
    // Le serveur compte hors filtre de statut : sélectionner une étape ne doit
    // plus faire disparaître les compteurs des autres.
    renderApp(
      <QueueCounters
        value="submitted"
        onChange={vi.fn()}
        counts={counts}
        totalCount={42}
      />,
    );

    expect(
      screen.getByRole('button', { name: /7\s*en vérification/i }),
    ).toBeInTheDocument();
  });

  test('sans comptages fournis, aucune étape n’affiche de zéro trompeur', () => {
    renderApp(<QueueCounters value="" onChange={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'En vérification' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('l’étape active est signalée comme pressée', () => {
    renderApp(
      <QueueCounters
        value="under_verification"
        onChange={vi.fn()}
        counts={counts}
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
      <QueueCounters value="" onChange={onChange} counts={counts} />,
    );

    await userEvent.click(
      screen.getByRole('button', { name: /attente fidèle/i }),
    );

    expect(onChange).toHaveBeenCalledWith('info_requested');
  });

  test('les demandes terminées restent accessibles via l’historique', async () => {
    const onChange = vi.fn();
    renderApp(<QueueCounters value="" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Déposées' }));
    expect(onChange).toHaveBeenCalledWith('document_deposited');

    await userEvent.click(screen.getByRole('button', { name: 'Rejetées' }));
    expect(onChange).toHaveBeenCalledWith('rejected');
  });
});
