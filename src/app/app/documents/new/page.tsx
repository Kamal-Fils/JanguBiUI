import { AppShell } from '@/components/layouts/app-shell';
import { NewDocumentForm } from '@/features/documents/components/new-document-form';

export default function NewDocumentPage() {
  return (
    <AppShell hideNav>
      <NewDocumentForm />
    </AppShell>
  );
}
