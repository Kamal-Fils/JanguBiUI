import { formatDocumentType } from '../format-document-type';

describe('formatDocumentType', () => {
  test('rend le libellé officiel des types connus', () => {
    expect(formatDocumentType('baptism')).toBe('Certificat de baptême');
    expect(formatDocumentType('religious_marriage')).toBe(
      'Attestation de mariage religieux',
    );
  });

  test('« Autre » affiche la précision du fidèle plutôt que le libellé générique', () => {
    // C'est cette précision qui dit à l'agent de quel acte il s'agit.
    expect(
      formatDocumentType('other', 'Certificat de profession religieuse'),
    ).toBe('Certificat de profession religieuse');
  });

  test('« Autre » sans précision retombe sur le libellé générique', () => {
    expect(formatDocumentType('other')).toBe('Autre document');
    expect(formatDocumentType('other', '   ')).toBe('Autre document');
    expect(formatDocumentType('other', null)).toBe('Autre document');
  });

  test('la précision est ignorée pour un type qui n’est pas « Autre »', () => {
    expect(formatDocumentType('baptism', 'texte résiduel')).toBe(
      'Certificat de baptême',
    );
  });

  test('un type inconnu reste lisible', () => {
    expect(formatDocumentType('some_new_type')).toBe('some new type');
  });
});
