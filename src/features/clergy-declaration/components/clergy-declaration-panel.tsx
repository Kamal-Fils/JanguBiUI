'use client';

import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';

import { useMyClergyDeclaration } from '../api/get-my-clergy-declaration';

import { ClergyDeclarationForm } from './clergy-declaration-form';
import { ClergyDeclarationStatus } from './clergy-declaration-status';

/**
 * Aiguillage du parcours (R1 — le trajet prime sur l'écran) : l'utilisateur
 * arrive sur UN écran qui sait déjà où il en est, plutôt que de devoir choisir
 * entre « déclarer » et « suivre ».
 *
 * - jamais déclaré           → le formulaire
 * - en attente / approuvée   → le suivi seul (re-soumission interdite côté serveur)
 * - refusée                  → le suivi AVEC son motif, puis le formulaire de reprise
 */
export function ClergyDeclarationPanel() {
  const { data: declaration, isLoading, isError, refetch } = useMyClergyDeclaration();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-2/3" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Impossible de charger votre demande"
        onRetry={() => refetch()}
      />
    );
  }

  if (!declaration) {
    return <ClergyDeclarationForm />;
  }

  return (
    <div className="space-y-6">
      <ClergyDeclarationStatus declaration={declaration} />
      {declaration.status === 'rejected' && (
        <ClergyDeclarationForm isResubmission />
      )}
    </div>
  );
}
