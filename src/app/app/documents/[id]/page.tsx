'use client';

import { use } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { DocumentDetail } from '@/features/documents/components/document-detail';

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

const DocumentDetailPage = ({ params }: DocumentDetailPageProps) => {
  const { id } = use(params);
  return (
    <AppShell hideNav>
      <DocumentDetail documentId={id} />
    </AppShell>
  );
};

export default DocumentDetailPage;
