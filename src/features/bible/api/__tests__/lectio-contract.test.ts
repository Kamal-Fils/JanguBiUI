import { lectioDivinaSchema } from '../get-lectio-sessions';
import { readingPlanSchema } from '../get-reading-plans';

/**
 * Contrats revenus du backend, verrouillés ici parce qu'ils viennent tous deux
 * de pannes silencieuses.
 *
 * **Lectio** — le client envoyait `passage_id: 0` comme sentinelle « lecture du
 * jour », convention que le serveur ne connaissait pas : 400 « Verset
 * introuvable » à chaque sauvegarde, quatre étapes de méditation perdues sans
 * message. Le serveur reconnaît désormais l'absence de passage, et sa réponse
 * porte `passage_id: null` — que le schéma d'alors, exigeant un nombre, aurait
 * rejeté au parse.
 *
 * **Parcours de lecture** — l'interface proposait « S'inscrire » ET « Se
 * désinscrire » en permanence, faute d'état exposé.
 */

const BASE_SESSION = {
  id: 1,
  lectio: 'Texte lu',
  meditatio: 'Méditation',
  oratio: 'Prière',
  contemplatio: 'Contemplation',
  updated_at: '2026-07-19T10:00:00Z',
};

describe('lectioDivinaSchema', () => {
  it('accepte une session rattachée à un verset', () => {
    const parsed = lectioDivinaSchema.parse({
      ...BASE_SESSION,
      passage_id: 42,
    });
    expect(parsed.passage_id).toBe(42);
  });

  it('accepte une session « du jour » sans verset', () => {
    // Le cas qui cassait : la réponse réelle du serveur.
    const parsed = lectioDivinaSchema.parse({
      ...BASE_SESSION,
      passage_id: null,
      session_date: '2026-07-19',
    });
    expect(parsed.passage_id).toBeNull();
    expect(parsed.session_date).toBe('2026-07-19');
  });

  it('tolère l’absence de session_date (front déployé avant le backend)', () => {
    expect(() =>
      lectioDivinaSchema.parse({ ...BASE_SESSION, passage_id: null }),
    ).not.toThrow();
  });
});

describe('readingPlanSchema', () => {
  const BASE_PLAN = {
    id: 1,
    title: 'Évangile en 30 jours',
    description: 'Un parcours',
    is_published: true,
    created_at: '2026-07-19T10:00:00Z',
  };

  it('lit l’état d’inscription quand le serveur l’expose', () => {
    expect(
      readingPlanSchema.parse({ ...BASE_PLAN, is_subscribed: true })
        .is_subscribed,
    ).toBe(true);
  });

  it('tolère son absence sans faire échouer la liste', () => {
    // Front déployé avant le backend : mieux vaut afficher « S'inscrire » que
    // planter tout l'écran des parcours.
    const parsed = readingPlanSchema.parse(BASE_PLAN);
    expect(parsed.is_subscribed).toBeUndefined();
  });
});
