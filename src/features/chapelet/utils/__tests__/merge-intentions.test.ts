import type { LiveIntention } from '../../hooks/use-community-rosary-socket';
import { mergeIntentions } from '../merge-intentions';

/** Entrée d'historique : identité serveur connue. */
const fromHistory = (
  serverId: number,
  text: string,
  submittedBy = 'marie@jangubi.sn',
): LiveIntention => ({
  id: `history-intention-${serverId}`,
  serverId,
  text,
  submittedBy,
});

/** Trame temps réel : aucune identité serveur (le consumer n'en met pas). */
const fromLive = (
  seq: number,
  text: string,
  submittedBy = 'marie@jangubi.sn',
): LiveIntention => ({
  id: `live-intention-${seq}`,
  text,
  submittedBy,
});

describe('mergeIntentions', () => {
  test('keeps history first, then the live flow, in chronological order', () => {
    // Arrange
    const history = [fromHistory(1, 'Pour les malades')];
    const live = [fromLive(1, 'Pour la paix')];

    // Act
    const merged = mergeIntentions(history, live);

    // Assert
    expect(merged.map((i) => i.text)).toEqual([
      'Pour les malades',
      'Pour la paix',
    ]);
  });

  test('absorbs a live echo of an intention already present in the history', () => {
    // Arrange — l'intention a été déposée entre l'émission du GET et sa
    // résolution : elle arrive par les DEUX chemins.
    const history = [fromHistory(7, 'Pour les vocations', 'diacre@jangubi.sn')];
    const live = [fromLive(1, 'Pour les vocations', 'diacre@jangubi.sn')];

    // Act
    const merged = mergeIntentions(history, live);

    // Assert — un seul exemplaire, celui qui porte l'identité serveur.
    expect(merged).toHaveLength(1);
    expect(merged[0].serverId).toBe(7);
  });

  test('deduplicates the history against itself on its server id', () => {
    // Arrange — même id servi deux fois (remontage, refetch).
    const history = [fromHistory(3, 'Pour ma famille'), fromHistory(3, 'Pour ma famille')];

    // Act
    const merged = mergeIntentions(history, []);

    // Assert
    expect(merged).toHaveLength(1);
  });

  test('keeps a genuinely repeated intention instead of collapsing it', () => {
    // Arrange — un priant confie DEUX fois le même texte pendant la session :
    // l'historique n'en contient qu'un, le direct en diffuse deux.
    const history = [fromHistory(1, 'Pour ma famille', 'paul@jangubi.sn')];
    const live = [
      fromLive(1, 'Pour ma famille', 'paul@jangubi.sn'),
      fromLive(2, 'Pour ma famille', 'paul@jangubi.sn'),
    ];

    // Act
    const merged = mergeIntentions(history, live);

    // Assert — le premier live est l'écho de l'historique, le second est réel.
    // Un filtre naïf par (auteur, texte) l'aurait effacé en silence.
    expect(merged).toHaveLength(2);
  });

  test('does not confuse the same text submitted by two different people', () => {
    // Arrange
    const history = [fromHistory(1, 'Pour la paix', 'marie@jangubi.sn')];
    const live = [fromLive(1, 'Pour la paix', 'paul@jangubi.sn')];

    // Act
    const merged = mergeIntentions(history, live);

    // Assert — deux priants distincts, deux intentions.
    expect(merged).toHaveLength(2);
    expect(merged.map((i) => i.submittedBy)).toEqual([
      'marie@jangubi.sn',
      'paul@jangubi.sn',
    ]);
  });

  test('returns the live flow untouched when there is no history', () => {
    // Arrange — cas du 403 : l'historique est inaccessible, la prière continue.
    const live = [fromLive(1, 'Pour les malades'), fromLive(2, 'Pour la paix')];

    // Act
    const merged = mergeIntentions([], live);

    // Assert
    expect(merged).toEqual(live);
  });
});
