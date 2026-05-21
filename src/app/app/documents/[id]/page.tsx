'use client';

import { AppShell } from '@/components/layouts/app-shell';
import { DocumentDetail } from '@/features/documents/components/document-detail';

const DocumentDetailPage = ({ params }: { params: { id: string } }) => (
  <AppShell hideNav>
    <DocumentDetail documentId={params.id} />
  </AppShell>
);

export default DocumentDetailPage;
