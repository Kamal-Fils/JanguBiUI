'use client';

import { HeartHandshake } from 'lucide-react';
import { useState } from 'react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button';
import { Card, CardEyebrow } from '@/components/ui/card/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Pill } from '@/components/ui/pill';
import { SectionHeader } from '@/components/ui/section-header';
import { useCampaigns } from '@/features/dons/api/get-campaigns';
import { useMakeDonation } from '@/features/dons/api/make-donation';
import { CampaignCard } from '@/features/dons/components/campaign-card';
import { CampaignsSkeleton } from '@/features/dons/components/campaigns-skeleton';
import { ProviderPicker } from '@/features/dons/components/provider-picker';
import { formatXof } from '@/features/dons/utils/format-xof';
import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

// Paiement en ligne désactivé tant que l'IPN (5b) n'est pas livré : le back
// rejette ces providers (garde 5a). Seules les espèces sont actives.
const ONLINE_PROVIDERS = ['wave', 'orange_money', 'free_money'];

/** Montants suggérés — raccourcis purement visuels (pré-remplissent le champ). */
const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

const labelClass = 'mb-1.5 block text-xs font-medium text-muted-foreground';
const fieldClass =
  'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

export default function DonsPage() {
  const { data, isLoading, isError, refetch } = useCampaigns();
  const { data: user } = useUser();
  const memberships = user?.memberships ?? [];
  const primaryMembership =
    memberships.find((m) => m.is_primary) ?? memberships[0];

  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  );
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('cash');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [churchId, setChurchId] = useState<number | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<string | null>(null);

  // Défaut = église principale ; l'utilisateur peut en choisir une autre.
  const selectedChurchId = churchId ?? primaryMembership?.church.id ?? null;
  const chosenMembership = memberships.find(
    (m) => m.church.id === selectedChurchId,
  );

  const { mutate: donate, isPending } = useMakeDonation({
    onSuccess: () => {
      setSelectedCampaignId(null);
      setAmount('');
    },
  });

  const handleDonate = () => {
    const parsedAmount = parseInt(amount, 10);
    if (!parsedAmount || parsedAmount < 1) return;
    if (ONLINE_PROVIDERS.includes(provider)) {
      setPaymentNotice(
        'Le paiement en ligne (Wave, Orange Money, Free Money) sera bientôt disponible. Veuillez choisir « Espèces ».',
      );
      return;
    }
    setPaymentNotice(null);
    donate({
      campaign_id: selectedCampaignId,
      church_id: selectedChurchId,
      parish_id: chosenMembership?.parish.id ?? null,
      amount: parsedAmount,
      payment_provider: provider,
      is_anonymous: isAnonymous,
    });
  };

  useRegisterPageMeta({ title: 'Dons & Quêtes' });

  const selectedCampaign = data?.results.find(
    (c) => c.id === selectedCampaignId,
  );

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-2xl flex-1 space-y-7 overflow-y-auto p-4 lg:max-w-3xl">
        <section aria-label="Campagnes de dons">
          <SectionHeader
            eyebrow="Générosité"
            title="Campagnes en cours"
            description="Choisissez une campagne à soutenir, ou faites un don libre ci-dessous."
          />

          {isLoading && <CampaignsSkeleton />}
          {isError && (
            <ErrorState
              title="Impossible de charger les campagnes"
              onRetry={() => refetch()}
            />
          )}
          {data && data.results.length === 0 && (
            <EmptyState
              icon={<HeartHandshake aria-hidden="true" />}
              title="Aucune campagne pour le moment"
              description="Aucune quête ou campagne n'est ouverte actuellement. Votre paroisse a pourtant toujours besoin de vous : un don libre, même modeste, soutient sa mission au quotidien."
            />
          )}
          {data && data.results.length > 0 && (
            <div className="flex flex-col gap-3">
              {data.results.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  selected={selectedCampaignId === campaign.id}
                  onToggle={() =>
                    setSelectedCampaignId(
                      selectedCampaignId === campaign.id ? null : campaign.id,
                    )
                  }
                />
              ))}
            </div>
          )}
        </section>

        <Card variant="sacred">
          <section aria-label="Faire un don" className="space-y-4 p-5">
            <header className="space-y-1">
              <CardEyebrow className="text-gold-ink">
                Votre offrande
              </CardEyebrow>
              <h2 className="font-serif text-lg font-bold tracking-tight text-foreground">
                Faire un don
              </h2>
              <div className="hairline-gold" aria-hidden="true" />
            </header>

            {memberships.length > 0 && (
              <div>
                <label htmlFor="beneficiary-select" className={labelClass}>
                  Bénéficiaire
                </label>
                <select
                  id="beneficiary-select"
                  value={selectedChurchId ?? ''}
                  onChange={(e) => setChurchId(Number(e.target.value))}
                  className={fieldClass}
                >
                  {memberships.map((m) => (
                    <option key={m.id} value={m.church.id}>
                      {m.church.name} — {m.parish.name}
                      {m.is_primary ? ' (principale)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="amount-input" className={labelClass}>
                Montant (XOF)
              </label>
              <input
                id="amount-input"
                type="number"
                min={1}
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex. 5000"
                className={cn(fieldClass, 'tabular-nums')}
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_AMOUNTS.map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    aria-pressed={amount === String(quick)}
                    onClick={() => setAmount(String(quick))}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      amount === String(quick)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                    )}
                  >
                    {formatXof(quick)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p id="provider-label" className={labelClass}>
                Méthode de paiement
              </p>
              <ProviderPicker
                value={provider}
                onChange={(value) => {
                  setProvider(value);
                  setPaymentNotice(null);
                }}
                labelledBy="provider-label"
              />
              {paymentNotice && (
                <p className="mt-2 text-xs text-warning" role="alert">
                  {paymentNotice}
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/60 bg-background/60 px-3.5 py-3 text-sm text-foreground transition-colors hover:border-primary/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="size-4 rounded accent-primary focus-visible:outline-none"
              />
              <span>
                Don anonyme
                <span className="block text-xs text-muted-foreground">
                  Votre nom n&apos;apparaîtra pas auprès de la paroisse.
                </span>
              </span>
            </label>

            {selectedCampaign && (
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 px-3.5 py-2.5">
                <Pill tone="primary" className="shrink-0">
                  Campagne
                </Pill>
                <p className="min-w-0 truncate text-xs text-foreground">
                  Campagne sélectionnée :{' '}
                  <span className="font-semibold">{selectedCampaign.title}</span>
                </p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleDonate}
              disabled={isPending || !amount}
            >
              {isPending ? 'Traitement…' : 'Confirmer le don'}
            </Button>
          </section>
        </Card>
      </div>
    </div>
  );
}
