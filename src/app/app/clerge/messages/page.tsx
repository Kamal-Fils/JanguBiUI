'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import type { ClergicalMessage } from '@/features/messaging/api/get-clerical-inbox';
import { ClericalComposeForm } from '@/features/messaging/components/clerical-compose-form';
import { ClericalInboxList } from '@/features/messaging/components/clerical-inbox-list';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

type Tab = 'inbox' | 'compose';

export default function ClergeMessagesPage() {
  const { data: user } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>('inbox');
  const [selectedMessage, setSelectedMessage] =
    useState<ClergicalMessage | null>(null);

  if (!isClergy(user)) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>Cette section est réservée aux membres du clergé.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Messages inter-clergé" />

      <div className="flex border-b border-gray-200 px-4">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'inbox'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('inbox')}
          type="button"
        >
          Boîte de réception
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'compose'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('compose')}
          type="button"
        >
          Nouveau message
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'inbox' && (
          <>
            <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-y-auto">
              <ClericalInboxList
                onSelect={setSelectedMessage}
                selectedId={selectedMessage?.id}
              />
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {selectedMessage ? (
                <div>
                  <h2 className="text-lg font-semibold mb-1">
                    {selectedMessage.subject}
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    De : {selectedMessage.sender_email} —{' '}
                    {new Date(selectedMessage.created_at).toLocaleString(
                      'fr-FR',
                    )}
                  </p>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                    {selectedMessage.body}
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center mt-12">
                  Sélectionnez un message pour le lire.
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === 'compose' && (
          <div className="flex-1 max-w-2xl">
            <ClericalComposeForm onSuccess={() => setActiveTab('inbox')} />
          </div>
        )}
      </div>
    </div>
  );
}
