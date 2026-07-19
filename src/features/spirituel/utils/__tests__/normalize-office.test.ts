import { toOfficeSections } from '../normalize-office';

describe('toOfficeSections', () => {
  it('retourne une liste vide sans office', () => {
    expect(toOfficeSections(null)).toEqual([]);
    expect(toOfficeSections(undefined)).toEqual([]);
  });

  it('accepte une section livrée en chaîne HTML', () => {
    // Arrange — forme « contrat OpenAPI » : hymn est une string.
    const office = { hymn: '<p>Ô Trinité bienheureuse</p>' };

    // Act
    const sections = toOfficeSections(office);

    // Assert
    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe('Hymne');
    expect(sections[0].blocks).toEqual([
      { html: '<p>Ô Trinité bienheureuse</p>' },
    ]);
  });

  it('accepte une section livrée en liste d’objets et compose la référence', () => {
    // Arrange — forme réellement renvoyée pour les psaumes.
    const office = {
      psalms: [
        {
          citation: 'Psaume 62',
          title: 'Au désert',
          text: '<p>Dieu, tu es mon Dieu</p>',
        },
        { citation: 'Psaume 149', text: '<p>Chantez au Seigneur</p>' },
      ],
    };

    // Act
    const [psalms] = toOfficeSections(office);

    // Assert
    expect(psalms.label).toBe('Psaumes');
    expect(psalms.blocks).toEqual([
      {
        citation: 'Psaume 62 — Au désert',
        html: '<p>Dieu, tu es mon Dieu</p>',
      },
      { citation: 'Psaume 149', html: '<p>Chantez au Seigneur</p>' },
    ]);
  });

  it('accepte une liste de chaînes', () => {
    const [intercessions] = toOfficeSections({
      intercessions: ['<p>Pour l’Église</p>', '<p>Pour les malades</p>'],
    });

    expect(intercessions.blocks).toEqual([
      { html: '<p>Pour l’Église</p>' },
      { html: '<p>Pour les malades</p>' },
    ]);
  });

  it('écarte les sections vides plutôt que d’afficher un titre orphelin', () => {
    const sections = toOfficeSections({
      hymn: '   ',
      psalms: [],
      canticle: null,
      intercessions: [{ text: '' }],
      conclusion: '<p>Amen</p>',
    });

    expect(sections.map((section) => section.key)).toEqual(['conclusion']);
  });

  it('restitue les sections dans l’ordre de récitation', () => {
    // Arrange — clés volontairement désordonnées dans l'objet.
    const office = {
      intercessions: '<p>Prions</p>',
      hymn: '<p>Hymne</p>',
      conclusion: '<p>Amen</p>',
      intro: '<p>Ouverture</p>',
      psalms: '<p>Psaume</p>',
    };

    // Act
    const keys = toOfficeSections(office).map((section) => section.key);

    // Assert
    expect(keys).toEqual([
      'intro',
      'hymn',
      'psalms',
      'intercessions',
      'conclusion',
    ]);
  });

  it('tolère les deux orthographes hymn / hymns', () => {
    const [hymn] = toOfficeSections({
      hymns: [{ text: '<p>Veni Creator</p>' }],
    });

    expect(hymn.label).toBe('Hymne');
    expect(hymn.blocks).toEqual([{ html: '<p>Veni Creator</p>' }]);
  });
});
