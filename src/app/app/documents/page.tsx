import { AppShell } from '@/components/layouts/app-shell';
import { DocumentsList } from '@/features/documents/components/documents-list';

export default function DocumentsPage() {
  return (
    <AppShell>
      <DocumentsList />
    </AppShell>
  );
}
