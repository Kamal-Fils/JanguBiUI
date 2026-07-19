'use client';

import { Clock } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { OfficeKey, useOffice } from '../../api/get-office';
import { toOfficeSections } from '../../utils/normalize-office';
import { OfficeSections } from '../office-sections';

interface OfficeViewProps {
  officeKey: OfficeKey;
  fontSize: number;
  /** Faux pour un fidèle : la requête ne part pas (403 côté backend). */
  enabled?: boolean;
}

function OfficeSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-8">
      {[0, 1].map((block) => (
        <div key={block}>
          <Skeleton className="h-3 w-24" />
          <div className="mt-3 flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((line) => (
              <Skeleton key={line} className="h-4 w-full last:w-2/3" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function OfficeView({
  officeKey,
  fontSize,
  enabled = true,
}: OfficeViewProps) {
  const {
    data: office,
    isLoading,
    isError,
    refetch,
  } = useOffice(officeKey, {
    enabled,
  });

  if (isLoading) return <OfficeSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title="Cet office n’a pas pu être chargé"
        description="La liaison avec l’AELF n’a pas répondu. Vous pouvez réessayer maintenant."
        onRetry={() => void refetch()}
      />
    );
  }

  const sections = toOfficeSections(office);

  if (sections.length === 0) {
    return (
      <EmptyState
        icon={<Clock />}
        title="Cet office n’est pas encore disponible"
        description="Les textes sont synchronisés chaque nuit depuis l’AELF. Revenez dans un moment."
      />
    );
  }

  return <OfficeSections sections={sections} fontSize={fontSize} />;
}
