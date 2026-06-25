'use client';

import { use } from 'react';

import { DocumentDetail } from '@/features/documents/components/document-detail';

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

const DocumentDetailPage = ({ params }: DocumentDetailPageProps) => {
  const { id } = use(params);
  return <DocumentDetail documentId={id} />;
};

export default DocumentDetailPage;
