'use client';

import { HeartHandshake } from 'lucide-react';
import { useRef, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
import { useCampaigns } from '@/features/dons/api/get-campaigns';
import { useMakeDonation } from '@/features/dons/api/make-donation';
import { CampaignCard } from '@/features/dons/components/campaign-card';
import { CampaignsSkeleton } from '@/features/dons/components/campaigns-skeleton';
import { ProviderPicker } from '@/features/dons/components/provider-picker';
import { StepHeading } from '@/features/dons/components/step-heading';
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

/**
 * Dons & Quêtes — un **parcours**, pas un formulaire (DIRECTION R1 : on juge le
 * trajet, pas la capture).
 *
 * Ce que le trajet corrigeait :
 *
 * - **la sélection d'une campagne ne menait nulle part.** On tapait une carte
 *   en haut de page, et il fallait ensuite faire défiler tout le reste pour
 *   trouver le champ montant. Le geste « je veux soutenir ceci » est désormais
 *   suivi d'un défilement vers l'acte : un tap mène du désir au montant.
 * - **on confirmait à l'aveugle.** Aucun récapitulatif ne disait *combien*, *à
 *   qui*, *comment* avant de valider un versement d'argent. Il y en a un
 *   maintenant, juste au-dessus du bouton.
 * - **l'échec était muet.** `useMakeDonation` n'exposait aucune erreur : un
 *   refus du serveur laissait le bouton retomber sans un mot, et le fidèle ne
 *   savait pas si son don était parti. L'erreur est affichée et l'action reste
 *   rejouable.
 * - **un montant invalide ne disait rien** : la saisie « abc » sortait
 *   silencieusement de la fonction.
 *
 * Les trois décisions sont numérotées et ordonnées : pour qui (déjà rempli par
 * défaut — zéro tap si on n'y touche pas), combien (la vraie décision, en
 * échelle), comment.
 */
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
  const [amountError, setAmountError] = useState<string | null>(null);

  const formRef = useRef<HTMLDivElement>(null);

  // Défaut = église principale ; l'utilisateur peut en choisir une autre.
  const selectedChurchId = churchId ?? primaryMembership?.church.id ?? null;
  const chosenMembership = memberships.find(
    (m) => m.church.id === selectedChurchId,
  );

  const {
    mutate: donate,
    isPending,
    isError: donationFailed,
    reset: resetDonation,
  } = useMakeDonation({
    onSuccess: () => {
      setSelectedCampaignId(null);
      setAmount('');
    },
  });

  const parsedAmount = Number.parseInt(amount, 10);
  const isAmountValid = Number.isFinite(parsedAmount) && parsedAmount >= 1;

  /**
   * Choisir une campagne conduit à l'acte. Sans ce déplacement, la sélection
   * était un cul-de-sac : rien ne bougeait à l'écran sous le doigt.
   */
  const handleSelectCampaign = (campaignId: number) => {
    const next = selectedCampaignId === campaignId ? null : campaignId;
    setSelectedCampaignId(next);
    if (next !== null) {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDonate = () => {
    resetDonation();

    if (!isAmountValid) {
      setAmountError('Saisissez un montant d’au moins 1 XOF.');
      return;
    }
    setAmountError(null);

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
      <ContentContainer className="flex-1 space-y-7 overflow-y-auto">
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
                  onToggle={() => handleSelectCampaign(campaign.id)}
                />
              ))}
            </div>
          )}
        </section>

        <div
          ref={formRef}
          className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-soft scroll-mt-4"
        >
          {/* Filet bleu : le bleu porte l'acte (R4). */}
          <div className="h-1.5 bg-primary" aria-hidden="true" />

          <section aria-labelledby="don-title" className="space-y-6 p-5">
            <header>
              <h2
                id="don-title"
                className="font-serif text-xl font-bold tracking-tight text-foreground"
              >
                Faire un don
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Trois choix, puis c’est fait.
              </p>
            </header>

            {/* ── 1. Pour qui ─────────────────────────────────────────────── */}
            {memberships.length > 0 && (
              <div>
                <StepHeading step={1} title="Pour qui ?" />
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
                {selectedCampaign && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Campagne soutenue :{' '}
                    <span className="font-semibold text-foreground">
                      {selectedCampaign.title}
                    </span>{' '}
                    <button
                      type="button"
                      onClick={() => setSelectedCampaignId(null)}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      retirer
                    </button>
                  </p>
                )}
              </div>
            )}

            {/* ── 2. Combien ──────────────────────────────────────────────── */}
            <div>
              <StepHeading
                step={memberships.length > 0 ? 2 : 1}
                title="Combien ?"
              />
              <label htmlFor="amount-input" className={labelClass}>
                Montant (XOF)
              </label>
              <input
                id="amount-input"
                type="number"
                min={1}
                inputMode="numeric"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setAmountError(null);
                }}
                placeholder="Ex. 5000"
                aria-invalid={amountError ? true : undefined}
                aria-describedby={amountError ? 'amount-error' : undefined}
                className={cn(
                  fieldClass,
                  // La somme est la vraie décision de l'écran : elle prend
                  // l'échelle (R2), le reste du formulaire reste en corps.
                  'text-xl font-semibold tabular-nums',
                  amountError && 'border-destructive focus:border-destructive',
                )}
              />
              {amountError && (
                <p
                  id="amount-error"
                  role="alert"
                  className="mt-1.5 text-xs font-medium text-destructive"
                >
                  {amountError}
                </p>
              )}
              <div className="mt-2.5 flex flex-wrap gap-2">
                {QUICK_AMOUNTS.map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    aria-pressed={amount === String(quick)}
                    onClick={() => {
                      setAmount(String(quick));
                      setAmountError(null);
                    }}
                    className={cn(
                      // ≥44px : la cible tactile principale du parcours (R3).
                      'inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                      amount === String(quick)
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:border-primary/40',
                    )}
                  >
                    {formatXof(quick)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── 3. Comment ─────────────────────────────────────────────── */}
            <div>
              <StepHeading
                step={memberships.length > 0 ? 3 : 2}
                title="Comment ?"
              />
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

            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground transition-colors hover:border-primary/30 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="size-4 rounded accent-primary focus-visible:outline-none"
              />
              <span>
                Don anonyme
                <span className="block text-xs text-muted-foreground">
                  Votre nom n’apparaîtra pas auprès de la paroisse.
                </span>
              </span>
            </label>

            {/* ── Récapitulatif : on ne valide pas un versement à l'aveugle ── */}
            {isAmountValid && (
              <dl
                aria-label="Récapitulatif du don"
                className="rounded-xl border border-border bg-background-surface/60 px-4 py-3 text-sm"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">Montant</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {formatXof(parsedAmount)}
                  </dd>
                </div>
                {chosenMembership && (
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-muted-foreground">
                      Bénéficiaire
                    </dt>
                    <dd className="min-w-0 truncate text-right text-foreground">
                      {chosenMembership.church.name}
                    </dd>
                  </div>
                )}
                {selectedCampaign && (
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <dt className="shrink-0 text-muted-foreground">Campagne</dt>
                    <dd className="min-w-0 truncate text-right text-foreground">
                      {selectedCampaign.title}
                    </dd>
                  </div>
                )}
              </dl>
            )}

            {donationFailed && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
              >
                Votre don n’a pas pu être enregistré. Aucun montant
                n’a été débité — vous pouvez réessayer.
              </p>
            )}

            <Button
              className="w-full"
              onClick={handleDonate}
              disabled={isPending}
            >
              {isPending ? 'Traitement…' : 'Confirmer le don'}
            </Button>
          </section>
        </div>
      </ContentContainer>
    </div>
  );
}
