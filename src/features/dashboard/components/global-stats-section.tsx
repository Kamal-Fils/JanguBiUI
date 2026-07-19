'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { ErrorState } from '@/components/ui/error-state';
import { MetricStrip, type WorkMetric } from '@/components/ui/metric-strip';
import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

import { useGlobalDashboard } from '../api/get-global-dashboard';


function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

const NUMBER_FR = new Intl.NumberFormat('fr-FR');

interface QueueRowProps {
  label: string;
  count: number;
  description: string;
  href: string;
}

/**
 * Une file d'attente = une ligne : le compte, ce que c'est, et le chemin pour
 * la traiter. Les cartes précédentes réservaient une surface de carte à un
 * unique nombre.
 */
function QueueRow({ label, count, description, href }: QueueRowProps) {
  const isEmpty = count === 0;

  return (
    <li>
      <Link
        href={href}
        className="group flex min-h-11 items-center gap-4 bg-card px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <span
          className={cn(
            'w-10 shrink-0 text-2xl font-bold tabular-nums',
            isEmpty ? 'text-muted-foreground' : 'text-warning',
          )}
        >
          {count}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {label}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {description}
          </span>
        </span>
        <ArrowRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:transform-none"
          aria-hidden="true"
        />
      </Link>
    </li>
  );
}

/**
 * Vue d'ensemble plateforme (super-admin) — archétype **Travail** (DIRECTION
 * R6) : compteurs globaux en bandeau, puis les files réellement actionnables.
 *
 * Le bloc renvoyait `null` sur erreur, laissant la page d'administration
 * s'ouvrir sur un vide inexpliqué. Il affiche désormais une erreur récupérable.
 */
export function GlobalStatsSection() {
  const { data, isLoading, isError, refetch } = useGlobalDashboard();

  if (isError) {
    return (
      <div className="mb-8">
        <ErrorState
          title="Vue d’ensemble indisponible"
          description="Les compteurs de la plateforme n'ont pas pu être chargés."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const metrics: WorkMetric[] = [
    {
      label: 'Utilisateurs',
      value: NUMBER_FR.format(data?.users_total ?? 0),
    },
    {
      label: 'Nouveaux (30 j)',
      value: `+${NUMBER_FR.format(data?.users_new_30d ?? 0)}`,
    },
    {
      label: 'Clergé',
      value: NUMBER_FR.format(data?.clergy_count ?? 0),
    },
    {
      label: 'Paroisses',
      value: NUMBER_FR.format(data?.parishes_count ?? 0),
      href: paths.app.admin.org.getHref(),
    },
    {
      label: 'Articles publiés',
      value: NUMBER_FR.format(data?.articles_published ?? 0),
      href: paths.app.admin.articles.getHref(),
    },
    {
      label: 'Dons (année)',
      value: formatXof(data?.donations_total_year ?? 0),
    },
  ];

  return (
    <div className="mb-8 flex flex-col gap-5">
      <section aria-labelledby="global-overview-title">
        <div className="mb-2.5 border-b border-border pb-1.5">
          <h2
            id="global-overview-title"
            className="text-sm font-semibold text-foreground"
          >
            Vue d’ensemble de la plateforme
          </h2>
        </div>
        {/* 6 colonnes ici : le super-admin lit six agrégats d'un bloc. */}
        <MetricStrip
          items={metrics}
          isLoading={isLoading}
          className="sm:grid-cols-3 lg:grid-cols-6"
        />
      </section>

      <section aria-labelledby="global-queues-title">
        <div className="mb-2.5 border-b border-border pb-1.5">
          <h2
            id="global-queues-title"
            className="text-sm font-semibold text-foreground"
          >
            Files d’attente
          </h2>
        </div>
        <ul className="flex flex-col divide-y divide-border overflow-hidden rounded-xl border border-border">
          <QueueRow
            label="Invitations clergé"
            count={data?.pending_clergy_invitations ?? 0}
            description="Invitations en attente d'acceptation"
            href={paths.app.admin.users.invitations.getHref()}
          />
          <QueueRow
            label="Documents"
            count={data?.pending_documents ?? 0}
            description="Demandes de documents en cours"
            href={paths.app.admin.documents.getHref()}
          />
        </ul>
      </section>
    </div>
  );
}
