'use client';

import { useState } from 'react';

import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button';
import { useCampaigns } from '@/features/dons/api/get-campaigns';
import { useMakeDonation } from '@/features/dons/api/make-donation';

const PAYMENT_PROVIDERS = [
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'cash', label: 'Espèces' },
];

const DONATION_TYPE_LABELS: Record<string, string> = {
  sunday_collection: 'Quête du dimanche',
  church_tithe: "Denier de l'Église",
  mass_intention_offering: 'Offrande de messe',
  special_project: 'Projet spécial',
  free_donation: 'Don libre',
};

export default function DonsPage() {
  const { data, isLoading } = useCampaigns();
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  );
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('wave');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const { mutate: donate, isPending } = useMakeDonation({
    onSuccess: () => {
      setSelectedCampaignId(null);
      setAmount('');
    },
  });

  const handleDonate = () => {
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount < 1) return;
    donate({
      campaign_id: selectedCampaignId,
      amount: parsedAmount,
      payment_provider: provider,
      is_anonymous: isAnonymous,
    });
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Dons & Quêtes" />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <p className="text-sm text-gray-500 text-center py-6">Chargement…</p>
        )}

        {data && data.results.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-6">
            Aucune campagne active.
          </p>
        )}

        {data &&
          data.results.map((campaign) => (
            <button
              key={campaign.id}
              type="button"
              className={`w-full text-left rounded-lg border p-4 cursor-pointer transition-colors ${
                selectedCampaignId === campaign.id
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
              onClick={() =>
                setSelectedCampaignId(
                  selectedCampaignId === campaign.id ? null : campaign.id,
                )
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-800">
                    {campaign.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {DONATION_TYPE_LABELS[campaign.donation_type] ??
                      campaign.donation_type}
                  </p>
                </div>
                {campaign.target_amount && (
                  <span className="text-xs text-gray-400">
                    Objectif :{' '}
                    {Number(campaign.target_amount).toLocaleString('fr-FR')} XOF
                  </span>
                )}
              </div>
              {campaign.description && (
                <p className="mt-2 text-xs text-gray-600 line-clamp-2">
                  {campaign.description}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {campaign.total_donations} don(s)
              </p>
            </button>
          ))}

        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Faire un don</h2>

          <div>
            <label
              htmlFor="amount-input"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Montant (XOF)
            </label>
            <input
              id="amount-input"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex. 5000"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label
              htmlFor="provider-select"
              className="block text-xs font-medium text-gray-600 mb-1"
            >
              Méthode de paiement
            </label>
            <select
              id="provider-select"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {PAYMENT_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            Don anonyme
          </label>

          {selectedCampaignId && (
            <p className="text-xs text-blue-600">
              Campagne sélectionnée :{' '}
              {data?.results.find((c) => c.id === selectedCampaignId)?.title}
            </p>
          )}

          <Button
            className="w-full"
            onClick={handleDonate}
            disabled={isPending || !amount}
          >
            {isPending ? 'Traitement…' : 'Confirmer le don'}
          </Button>
        </div>
      </div>
    </div>
  );
}
