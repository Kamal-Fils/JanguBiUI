import { render, screen } from '@testing-library/react';

import { DocumentStatus } from '../../types';
import { MiniTrack, getTrackIndex } from '../mini-track';

describe('MiniTrack', () => {
  test.each<[DocumentStatus, string]>([
    ['submitted', 'Étape 1 sur 4 : Soumise. Statut : Soumis.'],
    [
      'under_verification',
      'Étape 2 sur 4 : Vérification. Statut : En vérification.',
    ],
    ['validated', 'Étape 3 sur 4 : Validée. Statut : Validé.'],
    ['document_deposited', 'Étape 4 sur 4 : Déposée. Statut : Déposé.'],
  ])('places the track at the right stage for %s', (status, expected) => {
    render(<MiniTrack status={status} />);

    expect(screen.getByRole('img')).toHaveAccessibleName(expected);
  });

  test('info_requested waits at the verification stage, not a new one', () => {
    render(<MiniTrack status="info_requested" />);

    expect(screen.getByRole('img')).toHaveAccessibleName(
      'Étape 2 sur 4 : Vérification. Statut : Infos requises.',
    );
    expect(getTrackIndex('info_requested')).toBe(
      getTrackIndex('under_verification'),
    );
  });

  test('renders the four nominal stage labels', () => {
    render(<MiniTrack status="under_verification" />);

    expect(screen.getByText('Soumise')).toBeInTheDocument();
    expect(screen.getByText('Vérification')).toBeInTheDocument();
    expect(screen.getByText('Validée')).toBeInTheDocument();
    expect(screen.getByText('Déposée')).toBeInTheDocument();
  });

  test('exposes the track as a single graphic, not as loose text nodes', () => {
    render(<MiniTrack status="submitted" />);

    // role="img" + aria-label : le lecteur d'écran annonce l'étape courante
    // une seule fois au lieu d'épeler les quatre paliers.
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });
});
