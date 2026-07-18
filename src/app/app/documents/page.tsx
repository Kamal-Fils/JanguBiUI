'use client';

import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { paths } from '@/config/paths';
import { DocumentsList } from '@/features/documents/components/documents-list';
import { VaultContent } from '@/features/documents/components/vault-content';
import { useUser } from '@/lib/auth';
import { isAdmin, isClergy } from '@/lib/authorization';

/**
 * Deux vues, pas deux onglets : le hub est la page ; le coffre-fort est une
 * destination qu'on ouvre depuis sa carte d'accès et dont on revient. L'état
 * reste local (non partageable par URL) — il l'était déjà avec les onglets.
 */
type HubView = 'requests' | 'vault';

export default function DocumentsPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const [view, setView] = useState<HubView>('requests');

  useEffect(() => {
    if (!isLoading && isAdmin(user) && !isClergy(user)) {
      router.replace(paths.app.admin.documents.getHref());
    }
  }, [user, isLoading, router]);

  useRegisterPageMeta({
    title: 'Documents',
    subtitle: 'Vos demandes et documents officiels',
  });

  if (isLoading) return null;
  if (isAdmin(user) && !isClergy(user)) return null;

  return (
    <div className="flex flex-col">
      <ContentContainer>
        {view === 'requests' ? (
          <DocumentsList onOpenVault={() => setView('vault')} />
        ) : (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setView('requests')}
              className="inline-flex items-center gap-1 self-start rounded-lg py-1 text-sm font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Mes demandes
            </button>
            <VaultContent />
          </div>
        )}
      </ContentContainer>
    </div>
  );
}
