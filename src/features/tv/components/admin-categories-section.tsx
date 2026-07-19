'use client';

import { ListVideo, Lock } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn } from '@/utils/cn';

import { useTvCategories } from '../api/get-categories';
import type { TvCategory } from '../types';

import { CategoryForm } from './category-form';

/** En-têtes de colonnes « admin sobre » : micro-capitales espacées. */
const TH_CLASS = 'text-[11px] uppercase tracking-wide text-muted-foreground';

/**
 * Section admin « Catégories » : DataTable sobre (nom, accès, ordre) +
 * formulaire de création repliable. Pas d'actions par ligne : aucune mutation
 * d'édition/suppression de catégorie n'existe côté API.
 *
 * Archétype **Travail** : plus de carte à filet or ni de titre serif — même
 * vocabulaire que la file paroissiale (`/app/admin/documents`), qui sert de
 * référence. Zéro ornement, action principale visible.
 */
export function AdminCategoriesSection() {
  const { data: cats, isLoading, isError, refetch } = useTvCategories();
  const [showForm, setShowForm] = useState(false);

  const columns: DataTableColumn<TvCategory>[] = [
    {
      header: 'Catégorie',
      mobileLabel: 'Nom',
      headClassName: TH_CLASS,
      cell: (cat) => (
        <span className="text-sm font-medium text-foreground">{cat.name}</span>
      ),
    },
    {
      header: 'Accès',
      headClassName: TH_CLASS,
      cell: (cat) =>
        cat.is_clergy_only ? (
          <StatusBadge
            tone="progress"
            label="Clergé"
            icon={<Lock aria-hidden="true" />}
          />
        ) : (
          <StatusBadge tone="neutral" label="Public" />
        ),
    },
    {
      header: 'Ordre',
      headClassName: cn(TH_CLASS, 'text-right'),
      className: 'text-right',
      cell: (cat) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          #{cat.order}
        </span>
      ),
    },
  ];

  return (
    <section aria-labelledby="tv-categories-title">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2
          id="tv-categories-title"
          className="text-sm font-semibold text-foreground"
        >
          Catégories
        </h2>
        <Button
          size="sm"
          variant="outline"
          className="h-11 shrink-0 md:h-8"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Annuler' : '+ Catégorie'}
        </Button>
      </div>

      {showForm && (
        <div className="mb-4">
          <CategoryForm onSuccess={() => setShowForm(false)} />
        </div>
      )}

      {isError ? (
        <ErrorState
          title="Impossible de charger les catégories"
          onRetry={() => refetch()}
        />
      ) : (
        <DataTable
          data={cats?.results}
          columns={columns}
          rowKey={(cat) => cat.id}
          isLoading={isLoading}
          caption="Liste des catégories TV"
          emptyState={
            <EmptyState
              icon={<ListVideo aria-hidden="true" />}
              title="Créez votre première catégorie"
              description="Messes, enseignements, témoignages… Les catégories structurent la chaîne et guident les fidèles vers les bons programmes."
              action={
                <Button onClick={() => setShowForm(true)}>
                  Créer une catégorie
                </Button>
              }
            />
          }
        />
      )}
    </section>
  );
}
