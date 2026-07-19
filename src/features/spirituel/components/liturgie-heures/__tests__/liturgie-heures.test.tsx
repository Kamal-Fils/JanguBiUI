import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';
import type { PastoralRole } from '@/lib/auth';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp, screen, waitFor } from '@/testing/test-utils';

import { LiturgieHeures, getCurrentOfficeKey } from '../liturgie-heures';

const LITURGY = `${env.API_URL}/v1/liturgy/v1`;

const OFFICE_KEYS = [
  'laudes',
  'tierce',
  'sexte',
  'none',
  'vepres',
  'complies',
  'lectures',
] as const;

function mockLiturgyInfo() {
  server.use(
    http.get(`${LITURGY}/informations/`, () =>
      HttpResponse.json({
        id: 1,
        date: '2026-07-19',
        day_name: '16e dimanche du temps ordinaire',
        season: 'Temps ordinaire',
      }),
    ),
  );
}

/** Espionne les sept offices : l'heure courante décide lequel est demandé. */
function mockOffices() {
  const calls = vi.fn();
  server.use(
    ...OFFICE_KEYS.map((key) =>
      http.get(`${LITURGY}/${key}/`, () => {
        calls(key);
        return HttpResponse.json({
          id: 1,
          office_type: key,
          hymn: '<p>Ô Trinité bienheureuse</p>',
          psalms: [
            { citation: 'Psaume 62', text: '<p>Dieu, tu es mon Dieu</p>' },
          ],
        });
      }),
    ),
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

describe('getCurrentOfficeKey', () => {
  it('associe chaque tranche horaire à son office', () => {
    expect(getCurrentOfficeKey(new Date('2026-07-19T03:00:00'))).toBe(
      'lectures',
    );
    expect(getCurrentOfficeKey(new Date('2026-07-19T07:00:00'))).toBe('laudes');
    expect(getCurrentOfficeKey(new Date('2026-07-19T13:00:00'))).toBe('sexte');
    expect(getCurrentOfficeKey(new Date('2026-07-19T19:00:00'))).toBe('vepres');
    expect(getCurrentOfficeKey(new Date('2026-07-19T22:00:00'))).toBe(
      'complies',
    );
  });
});

describe('LiturgieHeures', () => {
  it('refuse l’accès au fidèle SANS déclencher la requête d’office', async () => {
    // Arrange — l'accès est refusé côté backend (CanAccessLiturgyOfHours) :
    // requêter quand même produirait un toast 403 à chaque visite.
    const seenUser = mockCurrentUser(null);
    mockLiturgyInfo();
    const officeCalls = mockOffices();

    // Act
    renderApp(<LiturgieHeures />);

    // Assert
    expect(
      await screen.findByText(/office réservé au clergé et aux religieux/i),
    ).toBeInTheDocument();
    await waitFor(() => expect(seenUser).toHaveBeenCalled());
    expect(officeCalls).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('group', { name: /choisir un office/i }),
    ).not.toBeInTheDocument();
  });

  it('affiche l’office et le sélecteur pour le clergé', async () => {
    // Arrange
    mockCurrentUser('pretre');
    mockLiturgyInfo();
    const officeCalls = mockOffices();

    // Act
    renderApp(<LiturgieHeures />);

    // Assert
    expect(
      await screen.findByRole('heading', {
        name: 'Liturgie des Heures',
        level: 1,
      }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('group', { name: /choisir un office/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Hymne')).toBeInTheDocument();
    expect(await screen.findByText(/Dieu, tu es mon Dieu/)).toBeInTheDocument();
    await waitFor(() => expect(officeCalls).toHaveBeenCalled());
  });

  it('affiche un état d’erreur récupérable quand l’office échoue', async () => {
    // Arrange
    mockCurrentUser('religieux');
    mockLiturgyInfo();
    server.use(
      ...OFFICE_KEYS.map((key) =>
        http.get(`${LITURGY}/${key}/`, () =>
          HttpResponse.json({ detail: 'boom' }, { status: 500 }),
        ),
      ),
    );

    // Act
    renderApp(<LiturgieHeures />);

    // Assert
    expect(
      await screen.findByText(/cet office n’a pas pu être chargé/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réessayer/i }),
    ).toBeInTheDocument();
  });

  it('affiche un état vide quand l’office n’a aucun contenu', async () => {
    // Arrange
    mockCurrentUser('diacre');
    mockLiturgyInfo();
    server.use(
      ...OFFICE_KEYS.map((key) =>
        http.get(`${LITURGY}/${key}/`, () =>
          HttpResponse.json({ id: 1, office_type: key }),
        ),
      ),
    );

    // Act
    renderApp(<LiturgieHeures />);

    // Assert
    expect(
      await screen.findByText(/cet office n’est pas encore disponible/i),
    ).toBeInTheDocument();
  });
});
