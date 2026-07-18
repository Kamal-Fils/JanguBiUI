'use client';

import { use } from 'react';

import { DocumentDetail } from '@/features/documents/components/document-detail';

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Détail + suivi d'une demande de document. Le titre / fil d'Ariane est
 * enregistré par `DocumentDetail` via `useRegisterPageMeta` (type de document
 * une fois chargé), comme le fait `EventDetail` pour l'agenda.
 */
const DocumentDetailPage = ({ params }: DocumentDetailPageProps) => {
  const { id } = use(params);
  return <DocumentDetail documentId={id} />;
};

export default DocumentDetailPage;
