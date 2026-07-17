'use client';

import { ListVideo, Lock } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { Card, CardContent } from '@/components/ui/card/card';
import { DataTable, type DataTableColumn } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { SectionHeader } from '@/components/ui/section-header';
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
    <Card variant="feature">
      <CardContent className="p-4 sm:p-5">
        <SectionHeader
          eyebrow="Diffusion"
          title="Catégories"
          action={
            <Button
              size="sm"
              variant="outline-gold"
              onClick={() => setShowForm((v) => !v)}
            >
              {showForm ? 'Annuler' : '+ Catégorie'}
            </Button>
          }
        />

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
      </CardContent>
    </Card>
  );
}
