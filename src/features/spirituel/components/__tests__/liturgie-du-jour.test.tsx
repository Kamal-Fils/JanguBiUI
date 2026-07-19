import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { PastoralRole } from '@/lib/auth';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, waitFor, within } from '@/testing/test-utils';

import { LiturgieDuJour } from '../liturgie-du-jour';

const LITURGY = `${env.API_URL}/v1/liturgy/v1`;

const READINGS = [
  {
    id: 1,
    type: 'lecture1',
    citation: 'Isaïe 55, 10-11',
    text: '<p>Comme la pluie et la neige descendent des cieux.</p>',
  },
  {
    id: 2,
    type: 'psaume',
    citation: 'Psaume 64',
    text: '<p>Tu visites la terre et tu l’abreuves.</p>',
  },
  {
    id: 3,
    type: 'evangile',
    citation: 'Matthieu 13, 1-23',
    text: '<p>Voici que le semeur sortit pour semer.</p>',
  },
];

const OFFICE = {
  id: 10,
  office_type: 'laudes',
  hymn: '<p>Ô Trinité bienheureuse</p>',
};

/** Handlers nominaux : jour liturgique + lectures de la messe. */
function mockLiturgyDay(readings: object = READINGS) {
  server.use(
    http.get(`${LITURGY}/informations/`, () =>
      HttpResponse.json({
        id: 1,
        date: '2026-07-19',
        zone: 'afrique',
        day_name: '16e dimanche du temps ordinaire',
        season: 'Temps ordinaire',
      }),
    ),
    http.get(`${LITURGY}/messes/`, () => HttpResponse.json(readings)),
  );
}

/** Espionne les deux offices ; renvoie le compteur d'appels. */
function mockOffices() {
  const calls = vi.fn();
  server.use(
    http.get(`${LITURGY}/laudes/`, () => {
      calls('laudes');
      return HttpResponse.json(OFFICE);
    }),
    http.get(`${LITURGY}/vepres/`, () => {
      calls('vepres');
      return HttpResponse.json({ ...OFFICE, id: 11, office_type: 'vepres' });
    }),
  );
  return calls;
}

function mockCurrentUser(pastoralRole: PastoralRole | null) {
  const seen = vi.fn();
  server.use(
    http.get(`${env.API_URL}/v1/auth/me/`, () => {
      seen();
      return HttpResponse.json(createUser({ pastoral_role: pastoralRole }));
    }),
  );
  return seen;
}

describe('LiturgieDuJour', () => {
  it('affiche les lectures du jour et le temps liturgique', async () => {
    // Arrange
    mockCurrentUser(null);
    mockLiturgyDay();
    mockOffices();

    // Act
    renderApp(<LiturgieDuJour />);

    // Assert — l'appareil éditorial et le texte des lectures sont rendus.
    expect(
      await screen.findByRole('heading', {
        name: 'Liturgie du jour',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Temps ordinaire')).toBeInTheDocument();
    expect(
      await screen.findByText(/Comme la pluie et la neige/),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/Voici que le semeur sortit/),
    ).toBeInTheDocument();
  });

  it('donne à l’Évangile un titre de niveau 2 avec sa citation', async () => {
    mockCurrentUser(null);
    mockLiturgyDay();
    mockOffices();

    renderApp(<LiturgieDuJour />);

    expect(
      await screen.findByRole('heading', {
        name: 'Matthieu 13, 1-23',
        level: 2,
      }),
    ).toBeInTheDocument();
    // « Évangile » apparaît deux fois : dans le sommaire et en surtitre de la
    // lecture — les deux sont voulus.
    expect(screen.getAllByText('Évangile')).toHaveLength(2);
  });

  it('propose un sommaire menant directement à chaque lecture', async () => {
    mockCurrentUser(null);
    mockLiturgyDay();
    mockOffices();

    renderApp(<LiturgieDuJour />);

    const sommaire = await screen.findByRole('navigation', {
      name: /sommaire des lectures/i,
    });
    const liens = within(sommaire).getAllByRole('link');
    expect(liens).toHaveLength(3);
    expect(liens[2]).toHaveAttribute('href', '#lecture-3');
  });

  it('masque les offices pour un fidèle SANS déclencher la requête', async () => {
    // Arrange — un fidèle n'a pas accès aux Heures : requêter renverrait 403
    // et l'intercepteur afficherait un toast à chaque visite.
    const seenUser = mockCurrentUser(null);
    mockLiturgyDay();
    const officeCalls = mockOffices();

    // Act
    renderApp(<LiturgieDuJour />);

    // Assert
    await waitFor(() => expect(seenUser).toHaveBeenCalled());
    await screen.findByText(/Voici que le semeur sortit/);

    expect(
      screen.queryByRole('heading', { name: /office divin/i }),
    ).not.toBeInTheDocument();
    expect(officeCalls).not.toHaveBeenCalled();
  });

  it('affiche l’office divin en complément pour le clergé', async () => {
    // Arrange
    mockCurrentUser('pretre');
    mockLiturgyDay();
    const officeCalls = mockOffices();

    // Act
    renderApp(<LiturgieDuJour />);

    // Assert
    expect(
      await screen.findByRole('heading', { name: /office divin/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Laudes')).toBeInTheDocument();
    await waitFor(() => expect(officeCalls).toHaveBeenCalledWith('laudes'));
  });

  it('affiche un état d’erreur récupérable quand les lectures échouent', async () => {
    // Arrange
    mockCurrentUser(null);
    mockOffices();
    server.use(
      http.get(`${LITURGY}/informations/`, () => HttpResponse.json({ id: 1 })),
      http.get(`${LITURGY}/messes/`, () =>
        HttpResponse.json({ detail: 'boom' }, { status: 500 }),
      ),
    );

    // Act
    renderApp(<LiturgieDuJour />);

    // Assert
    expect(
      await screen.findByText(/les lectures n’ont pas pu être chargées/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
  });

  it('affiche un état vide quand aucune lecture n’est publiée', async () => {
    // Arrange
    mockCurrentUser(null);
    mockLiturgyDay([]);
    mockOffices();

    // Act
    renderApp(<LiturgieDuJour />);

    // Assert
    expect(
      await screen.findByText(/pas encore de lectures pour aujourd’hui/i),
    ).toBeInTheDocument();
  });
});
