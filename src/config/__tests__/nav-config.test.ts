import {
  createAdminUser,
  createClergyUser,
  createUser,
} from '@/testing/data-generators';

import {
  buildBottomNavItems,
  buildNavItems,
  buildNavSections,
  buildOverflowNavItems,
  isSectionActive,
  isSubNavActive,
  type NavSection,
} from '../nav-config';

const labels = (items: { label: string }[]) => items.map((i) => i.label);

const sectionByLabel = (sections: NavSection[], label: string) =>
  sections.find((s) => s.label === label);

// Décision UX verrouillée (F3a) : home pastorale + admin ACCESSIBLE. Un curé
// (parish_admin + pretre) garde sa nav clergé et reçoit une passerelle
// « Administration » ; les dimensions role/pastoral_role sont indépendantes.

describe('buildNavItems', () => {
  test('fidèle laïc : nav fidèle, ni Clergé ni Administration', () => {
    const items = labels(buildNavItems(createUser()));
    expect(items).toContain('Documents');
    expect(items).not.toContain('Clergé');
    expect(items).not.toContain('Administration');
  });

  test('admin pur (sans pastoral_role) : nav admin, pas de Clergé', () => {
    const items = labels(buildNavItems(createAdminUser()));
    expect(items).toContain('Accueil');
    expect(items).not.toContain('Clergé');
    // Sa home EST l'admin (ITEM_ACCUEIL_ADMIN), pas de passerelle séparée.
    expect(items).not.toContain('Administration');
  });

  test('clergé non-admin : nav clergé SANS Administration', () => {
    const items = labels(buildNavItems(createClergyUser('pretre')));
    expect(items).toContain('Clergé');
    expect(items).not.toContain('Administration');
  });

  test('curé = parish_admin + pretre : nav clergé AVEC passerelle Administration', () => {
    const cure = createClergyUser('pretre', {
      role: 'parish_admin',
      is_admin: true,
    });
    const items = labels(buildNavItems(cure));
    expect(items).toContain('Clergé'); // home pastorale conservée
    expect(items).toContain('Administration'); // admin accessible
  });
});

describe('curé admin+clergé — accès admin sur mobile', () => {
  const cure = createClergyUser('pretre', {
    role: 'parish_admin',
    is_admin: true,
  });

  test('la bottom-nav reste clergé (pas de surcharge)', () => {
    expect(labels(buildBottomNavItems(cure))).not.toContain('Administration');
  });

  test('« Administration » est exposée via le menu overflow (≪ Plus ≫)', () => {
    expect(labels(buildOverflowNavItems(cure))).toContain('Administration');
  });
});

// ---------------------------------------------------------------------------
// Refonte V4-1 — sections de la sidebar (nav + sous-navs, RBAC).
// ---------------------------------------------------------------------------

describe('buildNavSections — RBAC', () => {
  test('fidèle : ni Espace clergé ni Administration, pas de Liturgie des heures', () => {
    const sections = buildNavSections(createUser());

    expect(labels(sections)).not.toContain('Espace clergé');
    expect(labels(sections)).not.toContain('Administration');
    expect(labels(sections)).toEqual(
      expect.arrayContaining([
        'Accueil',
        'Spiritualité',
        'Actualité',
        'Messages',
        'Documents',
        'Agenda',
        'Intentions',
        'Dons & Quêtes',
        'Transfert',
        'Profil',
      ]),
    );

    const spiritualite = sectionByLabel(sections, 'Spiritualité');
    expect(labels(spiritualite?.items ?? [])).toEqual([
      'Bible',
      'Lectio divina',
      'Parcours de lecture',
      'Liturgie du jour',
      'Chapelet',
      'TV catholique',
      'Assistant spirituel',
    ]);
  });

  test('clergé : Espace clergé (sections du hub) + Liturgie des heures, sans Administration', () => {
    const sections = buildNavSections(createClergyUser('pretre'));

    expect(labels(sections)).not.toContain('Administration');

    const clerge = sectionByLabel(sections, 'Espace clergé');
    expect(labels(clerge?.items ?? [])).toEqual([
      'Intentions de messe',
      'Messagerie inter-clergé',
      'Transferts paroissiaux',
      'Analytique',
    ]);

    const spiritualite = sectionByLabel(sections, 'Spiritualité');
    expect(labels(spiritualite?.items ?? [])).toContain('Liturgie des heures');
  });

  test('admin pur : Administration visible et Accueil pointe sur /app/admin', () => {
    const sections = buildNavSections(createAdminUser());

    expect(labels(sections)).toContain('Administration');
    expect(labels(sections)).not.toContain('Espace clergé');
    expect(sectionByLabel(sections, 'Accueil')?.href).toBe('/app/admin');
  });

  test('parish_admin : Administration SANS Utilisateurs / JanguBi TV / Structure', () => {
    const sections = buildNavSections(createAdminUser()); // role parish_admin
    const admin = sectionByLabel(sections, 'Administration');

    expect(labels(admin?.items ?? [])).toEqual([
      'Articles',
      'Documents',
      'Agenda',
    ]);
  });

  test('super_admin : Administration complète (Utilisateurs, TV, Structure)', () => {
    const sections = buildNavSections(createAdminUser({ role: 'super_admin' }));
    const admin = sectionByLabel(sections, 'Administration');

    expect(labels(admin?.items ?? [])).toEqual([
      'Articles',
      'Documents',
      'Agenda',
      'Utilisateurs',
      'JanguBi TV',
      'Structure',
    ]);
  });

  test('curé (pretre + parish_admin) : Espace clergé ET Administration, Accueil pastoral', () => {
    const cure = createClergyUser('pretre', {
      role: 'parish_admin',
      is_admin: true,
    });
    const sections = buildNavSections(cure);

    expect(labels(sections)).toContain('Espace clergé');
    expect(labels(sections)).toContain('Administration');
    expect(sectionByLabel(sections, 'Accueil')?.href).toBe('/app');
  });
});

describe('buildNavSections — sous-navs Actualité (filtre content_type)', () => {
  // Valeurs vérifiées sur ContentType (src/features/news/types) :
  // 'announcement' | 'article' | 'pastoral_letter'.
  test('items avec les query params exacts', () => {
    const actus = sectionByLabel(buildNavSections(createUser()), 'Actualité');

    expect(actus?.items).toEqual([
      { label: 'Tout', href: '/app/actus' },
      { label: 'Articles', href: '/app/actus?type=article' },
      { label: 'Annonces', href: '/app/actus?type=announcement' },
      {
        label: 'Lettres pastorales',
        href: '/app/actus?type=pastoral_letter',
      },
    ]);
  });
});

describe('buildNavSections — sous-navs Bible (vues internes ?tab=)', () => {
  // Valeurs vérifiées sur VALID_TABS (src/features/bible/components/
  // bible-content.tsx) : 'bible' (défaut) | 'lectio' | 'parcours'.
  test('items avec les query params exacts, positionnés après « Bible »', () => {
    const spiritualite = sectionByLabel(
      buildNavSections(createUser()),
      'Spiritualité',
    );

    expect(spiritualite?.items?.slice(0, 3)).toEqual([
      { label: 'Bible', href: '/app/bible' },
      { label: 'Lectio divina', href: '/app/bible?tab=lectio' },
      { label: 'Parcours de lecture', href: '/app/bible?tab=parcours' },
    ]);
  });
});

describe('isSubNavActive — activation avec query param `type`', () => {
  test('item filtré actif quand le type courant correspond', () => {
    expect(
      isSubNavActive('/app/actus', 'article', '/app/actus?type=article'),
    ).toBe(true);
    expect(
      isSubNavActive('/app/actus', 'announcement', '/app/actus?type=article'),
    ).toBe(false);
  });

  test('« Tout » actif sans filtre, inactif quand un type est actif', () => {
    expect(isSubNavActive('/app/actus', null, '/app/actus')).toBe(true);
    expect(isSubNavActive('/app/actus', 'article', '/app/actus')).toBe(false);
  });

  test('les routes détail activent « Tout » (préfixe)', () => {
    expect(isSubNavActive('/app/actus/article-1', null, '/app/actus')).toBe(
      true,
    );
  });

  test('un item hors de la base reste inactif', () => {
    expect(isSubNavActive('/app/bible', 'article', '/app/actus?type=article')).toBe(
      false,
    );
  });
});

describe('isSubNavActive — activation avec query param `tab` (Bible)', () => {
  // L'état courant est passé en URLSearchParams complet pour discriminer
  // `?tab=` ; la forme historique (valeur seule de `?type=`) reste supportée.
  test('item ?tab= actif quand le tab courant correspond', () => {
    expect(
      isSubNavActive(
        '/app/bible',
        new URLSearchParams('tab=lectio'),
        '/app/bible?tab=lectio',
      ),
    ).toBe(true);
    expect(
      isSubNavActive(
        '/app/bible',
        new URLSearchParams('tab=parcours'),
        '/app/bible?tab=lectio',
      ),
    ).toBe(false);
  });

  test('« Bible » (sans query) actif par défaut, inactif quand un tab est actif', () => {
    expect(
      isSubNavActive('/app/bible', new URLSearchParams(''), '/app/bible'),
    ).toBe(true);
    expect(
      isSubNavActive(
        '/app/bible',
        new URLSearchParams('tab=lectio'),
        '/app/bible',
      ),
    ).toBe(false);
  });

  test('rétro-compat : la valeur seule de ?type= fonctionne toujours (Actus)', () => {
    expect(
      isSubNavActive('/app/actus', 'article', '/app/actus?type=article'),
    ).toBe(true);
    expect(isSubNavActive('/app/actus', null, '/app/bible?tab=lectio')).toBe(
      false,
    );
    // Consommateur historique (valeur ?type= seule) sur /app/bible : « Bible »
    // reste l'item actif — le tab n'est pas discriminé sans l'URLSearchParams.
    expect(isSubNavActive('/app/bible', null, '/app/bible')).toBe(true);
  });
});

describe('isSectionActive', () => {
  const sections = buildNavSections(createClergyUser('pretre'));
  const spiritualite = sectionByLabel(sections, 'Spiritualité') as NavSection;
  const clerge = sectionByLabel(sections, 'Espace clergé') as NavSection;

  test('active via un de ses items (Bible → Spiritualité)', () => {
    expect(isSectionActive('/app/bible', null, spiritualite)).toBe(true);
  });

  test('active via sa racine (hub /app/spirituel, /app/clerge)', () => {
    expect(isSectionActive('/app/spirituel', null, spiritualite)).toBe(true);
    expect(isSectionActive('/app/clerge', null, clerge)).toBe(true);
  });

  test('inactive hors de son périmètre', () => {
    expect(isSectionActive('/app/documents', null, spiritualite)).toBe(false);
  });
});
