'use client';

import { FileText, Wallet } from 'lucide-react';

import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';
import { paths } from '@/config/paths';

import { useFideleDashboard } from '../api/get-fidele-dashboard';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

/**
 * Résumé personnel du fidèle : demandes en cours + total de ses dons.
 *
 * Le bloc renvoyait `null` sur erreur. Sur l'accueil, cette section est le
 * premier signe que l'application « sait » quelque chose sur vous : son
 * effacement silencieux laissait un trou entre le titre « Mon espace » et les
 * raccourcis, sans rien dire ni permettre de réessayer. On affiche désormais
 * une erreur récupérable.
 */
export function FideleSummarySection() {
  const { data, isLoading, isError, refetch } = useFideleDashboard();

  if (isError) {
    return (
      <ErrorState
        title="Votre résumé est indisponible"
        description="Vos demandes et vos dons n'ont pas pu être chargés."
        onRetry={() => refetch()}
      />
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4">
      <StatCard
        icon={<FileText />}
        value={data.documents.in_progress}
        label="Demandes en cours"
        href={paths.app.documents.getHref()}
        tone="primary"
      />
      <StatCard
        icon={<Wallet />}
        value={formatXof(data.donations.total)}
        label="Mes dons"
        href={paths.app.dons.getHref()}
        tone="success"
      />
    </section>
  );
}
