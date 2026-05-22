'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import type { ClergicalMessage } from '@/features/messaging/api/get-clerical-inbox';
import { ClericalComposeForm } from '@/features/messaging/components/clerical-compose-form';
import { ClericalInboxList } from '@/features/messaging/components/clerical-inbox-list';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';
import { cn } from '@/lib/utils';

type Tab = 'inbox' | 'compose';

export default function ClergeMessagesPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<ClergicalMessage | null>(null);

  useEffect(() => {
    if (!isLoading && !isClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, isLoading, router]);

  if (isLoading || !isClergy(user)) return null;

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader title="Messages inter-clergé" />

        <div className="flex border-b border-border px-4">
          {(['inbox', 'compose'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab === 'inbox' ? 'Boîte de réception' : 'Nouveau message'}
            </button>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'inbox' && (
            <>
              <div className="w-80 flex-shrink-0 border-r border-border overflow-y-auto">
                <ClericalInboxList
                  onSelect={setSelectedMessage}
                  selectedId={selectedMessage?.id}
                />
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                {selectedMessage ? (
                  <div>
                    <h2 className="text-lg font-semibold mb-1 text-foreground">
                      {selectedMessage.subject}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      De : {selectedMessage.sender_email} —{' '}
                      {new Date(selectedMessage.created_at).toLocaleString('fr-FR')}
                    </p>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                      {selectedMessage.body}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm text-center mt-12">
                    Sélectionnez un message pour le lire.
                  </p>
                )}
              </div>
            </>
          )}

          {activeTab === 'compose' && (
            <div className="flex-1 max-w-2xl p-6">
              <ClericalComposeForm onSuccess={() => setActiveTab('inbox')} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
