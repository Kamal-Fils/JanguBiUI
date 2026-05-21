'use client';

import { Clock } from 'lucide-react';

import { PageHeader } from '@/components/layouts/page-header';

// Type kept for backward compatibility with unused sub-components.
export type PretreType = 'pretre' | 'moine' | 'soeur';
export interface Pretre {
  id: string;
  name: string;
  type: PretreType;
  paroisse: string;
  localisation: string;
  online: boolean;
  phone?: string;
}

export function AlloPretreContent() {
  return (
    <div className="flex flex-col">
      <PageHeader title="Allo Prêtre" subtitle="Contactez un guide spirituel" />
      <div className="flex flex-col items-center gap-4 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Clock className="size-8 text-muted-foreground" />
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">
            Bientôt disponible
          </p>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            La fonctionnalité de mise en relation avec un guide spirituel sera
            disponible prochainement.
          </p>
        </div>
      </div>
    </div>
  );
}
