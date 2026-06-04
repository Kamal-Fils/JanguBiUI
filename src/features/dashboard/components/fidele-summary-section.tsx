'use client';

import { FileText, Wallet } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from '@/components/ui/stat-card';

import { useFideleDashboard } from '../api/get-fidele-dashboard';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

/** Résumé personnel du fidèle : demandes en cours + total de ses dons. */
export function FideleSummarySection() {
  const { data, isLoading, isError } = useFideleDashboard();

  if (isError) return null;
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <section className="grid grid-cols-2 gap-3 sm:gap-4">
      <StatCard
        icon={<FileText />}
        value={data.documents.in_progress}
        label="Demandes en cours"
        href="/app/documents"
        tone="gold"
      />
      <StatCard
        icon={<Wallet />}
        value={formatXof(data.donations.total)}
        label="Mes dons"
        href="/app/dons"
        tone="success"
      />
    </section>
  );
}
