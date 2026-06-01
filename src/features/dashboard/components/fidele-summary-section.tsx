'use client';

import { FileText, Wallet } from 'lucide-react';
import Link from 'next/link';

import { Skeleton } from '@/components/ui/skeleton';

import { useFideleDashboard } from '../api/get-fidele-dashboard';

function formatXof(amount: number): string {
  return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
}

/** Résumé personnel du fidèle : demandes en cours + total de ses dons. */
export function FideleSummarySection() {
  const { data, isLoading, isError } = useFideleDashboard();

  if (isError) return null;
  if (isLoading) return <Skeleton className="h-20 w-full rounded-xl" />;
  if (!data) return null;

  return (
    <section className="grid grid-cols-2 gap-3">
      <Link
        href="/app/documents"
        className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
      >
        <FileText className="size-4 text-amber-600" />
        <span className="text-2xl font-bold tabular-nums text-amber-600">
          {data.documents.in_progress}
        </span>
        <span className="text-xs text-muted-foreground">Demandes en cours</span>
      </Link>

      <Link
        href="/app/dons"
        className="flex flex-col gap-1 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
      >
        <Wallet className="size-4 text-emerald-600" />
        <span className="text-2xl font-bold tabular-nums text-emerald-600">
          {formatXof(data.donations.total)}
        </span>
        <span className="text-xs text-muted-foreground">Mes dons</span>
      </Link>
    </section>
  );
}
