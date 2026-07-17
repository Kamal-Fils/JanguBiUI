'use client';

import {
  BarChart3,
  Church,
  Clock,
  FileText,
  Landmark,
  MessageSquare,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { ContentContainer } from '@/components/layouts/content-container';
import { Card, CardEyebrow } from '@/components/ui/card/card';
import { QuickActionTile } from '@/components/ui/quick-action-tile';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { paths } from '@/config/paths';
import { useMyProvinceDashboard } from '@/features/dashboard/api/get-province-dashboard';
import { useUser } from '@/lib/auth';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

// ── Hero éditorial ────────────────────────────────────────────────────────────

function ArchevequeHero({ provinceName }: { provinceName?: string }) {
  const { data: user } = useUser();

  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const firstName = user?.profile?.first_name ?? '';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/85 p-7 text-primary-foreground shadow-glow-indigo motion-safe:animate-slide-up sm:p-9">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'radial-gradient(currentColor 0.6px, transparent 0.6px)',
            backgroundSize: '14px 14px',
          }}
        />
        <svg
          className="absolute -right-6 -top-10 size-56 text-primary-foreground/10 sm:size-64"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <rect x="10" y="2" width="4" height="20" rx="2" />
          <rect x="2" y="8" width="20" height="4" rx="2" />
        </svg>
      </div>

      <div className="relative">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/85">
          {greeting} · Conduite de la province
          {provinceName ? ` de ${provinceName}` : ''}
        </p>
        <h1 className="mt-1 truncate font-serif text-display font-black italic leading-[0.95] text-primary-foreground">
          {firstName || 'Bienvenue'}
        </h1>
        <div
          className="mt-4 h-px w-16 rounded-full bg-gold/70"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm capitalize text-primary-foreground/85">
          {dateStr}
        </p>
      </div>
    </div>
  );
}

// ── Accès rapides ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: 'Messages',
    href: paths.app.clerge.messages.getHref(),
    icon: MessageSquare,
    tone: 'info' as const,
  },
  {
    label: 'Analytique',
    href: paths.app.clerge.analytique.getHref(),
    icon: BarChart3,
    tone: 'primary' as const,
  },
  {
    label: 'Articles',
    href: paths.app.admin.articles.getHref(),
    icon: FileText,
    tone: 'success' as const,
  },
  {
    label: 'Inviter',
    href: paths.app.admin.users.invite.getHref(),
    icon: Users,
    tone: 'gold' as const,
  },
  {
    label: 'Liturgie',
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    tone: 'warning' as const,
  },
] as const;

// ── Composant principal ───────────────────────────────────────────────────────

/**
 * Dashboard de l'archevêque — vue PROVINCE (retour d'audit : il voyait le
 * dashboard évêque, scopé sur un seul diocèse). Alimenté par
 * GET /v1/dashboards/my-province/.
 */
export function ArchevequeDashboard() {
  const { data, isLoading, isError } = useMyProvinceDashboard();

  return (
    <ContentContainer width="wide">
      <div className="flex flex-col gap-8">
        <ArchevequeHero provinceName={data?.province.name} />

        {/* Chiffres clés de la province */}
        {isLoading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Diocèses"
              value={data.dioceses_count}
              icon={<Landmark />}
              tone="gold"
            />
            <StatCard
              label="Paroisses"
              value={data.parishes_count.toLocaleString('fr-FR')}
              icon={<Church />}
              tone="primary"
            />
            <StatCard
              label="Fidèles"
              value={data.total_fideles.toLocaleString('fr-FR')}
              icon={<Users />}
              tone="info"
            />
            <StatCard
              label="Dons (année)"
              value={formatXof(data.donations_total_year)}
              icon={<Wallet />}
              tone="success"
            />
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Impossible de charger la vue provinciale. Vérifiez que votre
              compte est rattaché à une province.
            </p>
          </div>
        ) : null}

        {/* Une ligne par diocèse */}
        {data && data.dioceses.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Province"
              title="Mes diocèses"
              description="Chiffres clés de chaque diocèse de la province."
            />
            <div className="flex flex-col gap-3">
              {data.dioceses.map((diocese) => (
                <Card key={diocese.id} variant="feature" className="p-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="min-w-0 flex-1 font-serif text-base font-bold text-foreground">
                      {diocese.name}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {diocese.parishes_count}
                      </span>{' '}
                      paroisse{diocese.parishes_count > 1 ? 's' : ''}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {diocese.fideles_count.toLocaleString('fr-FR')}
                      </span>{' '}
                      fidèle{diocese.fideles_count > 1 ? 's' : ''}
                    </span>
                    <span className="text-sm tabular-nums">
                      {diocese.pending_documents > 0 ? (
                        <span className="rounded-full bg-warning/10 px-2.5 py-0.5 font-medium text-warning">
                          {diocese.pending_documents} doc
                          {diocese.pending_documents > 1 ? 's' : ''} en attente
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">
                          À jour
                        </span>
                      )}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Accès rapides */}
        <section>
          <SectionHeader eyebrow="Raccourcis" title="Accès rapides" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <QuickActionTile
                  key={action.href}
                  href={action.href}
                  icon={<Icon />}
                  label={action.label}
                  tone={action.tone}
                />
              );
            })}
          </div>
        </section>

        <div className="hairline-gold" aria-hidden="true" />

        {/* Renvoi vers l'analytique provinciale complète */}
        <Card variant="sacred" className="p-4">
          <Link
            href={paths.app.clerge.analytique.getHref()}
            className="flex items-center justify-between gap-3"
          >
            <div>
              <CardEyebrow>Analytique</CardEyebrow>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Flux de dons et fidèles de toute la province, avec filtres par
                diocèse et par période.
              </p>
            </div>
            <BarChart3 className="size-5 shrink-0 text-gold" />
          </Link>
        </Card>
      </div>
    </ContentContainer>
  );
}
