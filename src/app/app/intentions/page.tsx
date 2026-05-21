'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { useMyIntentions } from '@/features/intentions/api/get-my-intentions';
import { IntentionStatusBadge } from '@/features/intentions/components/intention-status-badge';
import { SubmitIntentionForm } from '@/features/intentions/components/submit-intention-form';

export default function IntentionsPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useMyIntentions();

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Intentions de Messe" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-full rounded-lg border-2 border-dashed border-blue-300 py-3 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors"
        >
          {showForm ? 'Annuler' : '+ Nouvelle intention'}
        </button>

        {showForm && (
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Nouvelle intention de messe
            </h2>
            <SubmitIntentionForm onSuccess={() => setShowForm(false)} />
          </div>
        )}

        {isLoading && (
          <p className="text-sm text-gray-500 text-center py-6">Chargement…</p>
        )}

        {data && data.results.length === 0 && !showForm && (
          <p className="text-sm text-gray-500 text-center py-6">
            Vous n&apos;avez pas encore d&apos;intentions de messe.
          </p>
        )}

        {data &&
          data.results.map((intention) => (
            <div
              key={intention.id}
              className="rounded-lg border border-gray-200 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-800 flex-1">
                  {intention.intention_text}
                </p>
                <IntentionStatusBadge status={intention.status} />
              </div>
              {intention.pretre_email && (
                <p className="text-xs text-gray-500">
                  Prêtre : {intention.pretre_email}
                </p>
              )}
              {intention.proposed_date && (
                <p className="text-xs text-gray-500">
                  Date proposée :{' '}
                  {new Date(intention.proposed_date).toLocaleDateString(
                    'fr-FR',
                  )}
                </p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
