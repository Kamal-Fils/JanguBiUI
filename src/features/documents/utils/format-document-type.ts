const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  baptism: 'Certificat de baptême',
  first_communion: 'Attestation de première communion',
  confirmation: 'Attestation de confirmation',
  religious_marriage: 'Attestation de mariage religieux',
  godparent: 'Attestation parrain / marraine',
};

export function formatDocumentType(documentType: string): string {
  return DOCUMENT_TYPE_LABELS[documentType] ?? documentType.replace(/_/g, ' ');
}
