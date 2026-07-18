'use client';

import { Inbox } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills, type FilterOption } from '@/components/ui/filter-pills';
import { SectionHeader } from '@/components/ui/section-header';
import { paths } from '@/config/paths';
import { useParishIntentions } from '@/features/intentions/api/get-parish-intentions';
import { ClergyIntentionList } from '@/features/intentions/components/clergy-intention-list';
import { INTENTION_STATUS_CONFIG } from '@/features/intentions/components/intention-status-badge';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

/** Ordre du workflow : pending → accepted/date_proposed → confirmed → celebrated. */
const FILTERABLE_STATUSES = [
  'pending',
  'accepted',
  'date_proposed',
  'confirmed',
  'celebrated',
  'declined',
] as const;

export default function ClergeIntentionsPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useUser();
  const authorized = !userLoading && isClergy(user);
  const { data, isLoading, isError, refetch } = useParishIntentions(authorized);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!userLoading && !isClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, userLoading, router]);

  useRegisterPageMeta({
    title: 'Intentions reçues',
    subtitle: 'Recevoir et traiter les intentions de messe de votre paroisse',
  });

  const intentions = useMemo(() => data?.results ?? [], [data]);

  const filterOptions: FilterOption[] = useMemo(() => {
    const countByStatus = intentions.reduce<Record<string, number>>(
      (acc, intention) => {
        acc[intention.status] = (acc[intention.status] ?? 0) + 1;
        return acc;
      },
      {},
    );
    return [
      { value: 'all', label: 'Toutes', count: intentions.length },
      ...FILTERABLE_STATUSES.map((status) => ({
        value: status,
        label: INTENTION_STATUS_CONFIG[status]?.label ?? status,
        count: countByStatus[status] ?? 0,
      })),
    ];
  }, [intentions]);

  const filteredIntentions = useMemo(
    () =>
      statusFilter === 'all'
        ? intentions
        : intentions.filter((intention) => intention.status === statusFilter),
    [intentions, statusFilter],
  );

  if (userLoading || !isClergy(user)) return null;

  return (
    <div className="flex flex-col">
      <ContentContainer className="space-y-4">
        <SectionHeader
          eyebrow="Intentions de messe"
          title="Les intentions de votre paroisse"
          description="Les fidèles vous confient leurs intentions de prière. Acceptez-les, proposez une date de célébration, puis marquez-les célébrées."
        />

        {isError ? (
          <ErrorState
            title="Impossible de charger les intentions"
            description="Une erreur est survenue lors du chargement des intentions de votre paroisse."
            onRetry={() => refetch()}
          />
        ) : (
          <>
            {intentions.length > 0 && (
              <FilterPills
                options={filterOptions}
                value={statusFilter}
                onChange={setStatusFilter}
                ariaLabel="Filtrer par statut"
              />
            )}
            <ClergyIntentionList
              intentions={filteredIntentions}
              isLoading={isLoading || !authorized}
              emptyState={
                statusFilter !== 'all' && intentions.length > 0 ? (
                  <EmptyState
                    icon={<Inbox aria-hidden="true" />}
                    title="Aucune intention pour ce statut"
                    description="Aucune intention ne correspond au filtre sélectionné. Choisissez « Toutes » pour revoir l'ensemble des intentions."
                  />
                ) : undefined
              }
            />
          </>
        )}
      </ContentContainer>
    </div>
  );
}
