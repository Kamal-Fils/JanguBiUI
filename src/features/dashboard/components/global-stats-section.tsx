'use client';

import { Church, FileText, Landmark, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

import { Card, CardEyebrow } from '@/components/ui/card/card';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

import { useGlobalDashboard } from '../api/get-global-dashboard';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

interface QueueCardProps {
  label: string;
  count: number;
  description: string;
  href: string;
}

function QueueCard({ label, count, description, href }: QueueCardProps) {
  const isEmpty = count === 0;
  return (
    <Link href={href} className="group">
      <Card
        variant="feature"
        className={cn(
          'p-4 transition-transform group-hover:-translate-y-0.5 motion-reduce:transform-none',
          !isEmpty && 'border-warning/40',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <CardEyebrow>{label}</CardEyebrow>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {description}
            </p>
          </div>
          <span
            className={cn(
              'shrink-0 font-serif text-3xl font-black tabular-nums',
              isEmpty ? 'text-muted-foreground/60' : 'text-warning',
            )}
          >
            {count}
          </span>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Vue d'ensemble plateforme (super-admin) : compteurs globaux + files
 * d'attente actionnables. Alimentée par GET /v1/dashboards/global/.
 */
export function GlobalStatsSection() {
  const { data, isLoading, isError } = useGlobalDashboard();

  if (isError) return null;
  if (isLoading)
    return <Skeleton className="mb-8 h-40 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <div className="mb-8 flex flex-col gap-6">
      <section>
        <SectionHeader
          eyebrow="Plateforme"
          title="Vue d'ensemble"
          description="L'activité de Jàngu Bi en un coup d'œil."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          <StatCard
            label="Utilisateurs"
            value={data.users_total.toLocaleString('fr-FR')}
            icon={<Users />}
            tone="primary"
          />
          <StatCard
            label="Nouveaux (30 j)"
            value={`+${data.users_new_30d.toLocaleString('fr-FR')}`}
            icon={<TrendingUp />}
            tone="success"
          />
          <StatCard
            label="Clergé"
            value={data.clergy_count.toLocaleString('fr-FR')}
            icon={<Landmark />}
            tone="gold"
          />
          <StatCard
            label="Paroisses"
            value={data.parishes_count.toLocaleString('fr-FR')}
            icon={<Church />}
            tone="info"
            href={paths.app.admin.org.getHref()}
          />
          <StatCard
            label="Articles publiés"
            value={data.articles_published.toLocaleString('fr-FR')}
            icon={<FileText />}
            tone="primary"
            href={paths.app.admin.articles.getHref()}
          />
          <StatCard
            label="Dons (année)"
            value={formatXof(data.donations_total_year)}
            tone="success"
          />
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="À traiter"
          title="Files d'attente"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <QueueCard
            label="Invitations clergé"
            count={data.pending_clergy_invitations}
            description="Invitations en attente d'acceptation"
            href={paths.app.admin.users.invitations.getHref()}
          />
          <QueueCard
            label="Documents"
            count={data.pending_documents}
            description="Demandes de documents en cours"
            href={paths.app.admin.documents.getHref()}
          />
        </div>
      </section>

      <div className="hairline-gold" aria-hidden="true" />
    </div>
  );
}
