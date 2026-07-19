const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  baptism: 'Certificat de baptême',
  first_communion: 'Attestation de première communion',
  confirmation: 'Attestation de confirmation',
  religious_marriage: 'Attestation de mariage religieux',
  godparent: 'Attestation parrain / marraine',
  other: 'Autre document',
};

/**
 * Libellé affichable d'un type de document.
 *
 * Pour « Autre document », le libellé générique n'apprend rien à l'agent qui
 * traite la demande : c'est la précision saisie par le fidèle (`document_type_free`)
 * qui dit de quel acte il s'agit. On l'affiche donc à la place quand elle existe.
 */
export function formatDocumentType(
  documentType: string,
  freeText?: string | null,
): string {
  if (documentType === 'other' && freeText?.trim()) {
    return freeText.trim();
  }
  return DOCUMENT_TYPE_LABELS[documentType] ?? documentType.replace(/_/g, ' ');
}
