'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import { useUser } from '@/lib/auth';

import {
  useAddMemberships,
  useRemoveMembership,
  useSetPrimaryMembership,
} from '../api/update-parish';
import {
  ChurchCascadeSelector,
  type SelectedChurch,
} from './church-cascade-selector';

/**
 * Gestion des appartenances ecclésiales du profil (Chantier 7b) : lister, ajouter
 * (via la cascade du 7a), retirer, désigner la principale. Remplace l'ancienne
 * section paroisse/transfert. S'appuie sur /me (memberships[]).
 */
export function MembershipManager() {
  const { data: user } = useUser();
  const memberships = user?.memberships ?? [];

  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<SelectedChurch[]>([]);
  const [primaryChurchId, setPrimaryChurchId] = useState<number | null>(null);

  const { mutate: remove, isPending: removing } = useRemoveMembership();
  const { mutate: setPrimary, isPending: settingPrimary } =
    useSetPrimaryMembership();
  const { mutate: addMemberships, isPending: addPending } = useAddMemberships({
    onSuccess: () => {
      setSelected([]);
      setPrimaryChurchId(null);
      setAdding(false);
    },
  });

  const busy = removing || settingPrimary || addPending;

  const handleAdd = () => {
    if (selected.length === 0) return;
    addMemberships({ churchIds: selected.map((s) => s.churchId) });
  };

  return (
    <div className="space-y-3">
      <ul aria-label="Mes appartenances" className="space-y-2">
        {memberships.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {m.church.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {m.parish.name} · {m.diocese.name}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {m.is_primary ? (
                <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                  Principale
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setPrimary(m.id)}
                  disabled={busy}
                  className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted/80 disabled:opacity-50"
                >
                  Définir principale
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(m.id)}
                aria-label={`Retirer ${m.church.name}`}
                // On garde au moins une appartenance (sinon retour onboarding).
                disabled={busy || memberships.length <= 1}
                className="text-lg leading-none text-muted-foreground hover:text-destructive disabled:opacity-40"
              >
                ×
              </button>
            </div>
          </li>
        ))}
        {memberships.length === 0 && (
          <li className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            Aucune église pour le moment.
          </li>
        )}
      </ul>

      {adding ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <ChurchCascadeSelector
            selected={selected}
            primaryChurchId={primaryChurchId}
            onChange={(next, nextPrimary) => {
              setSelected(next);
              setPrimaryChurchId(nextPrimary);
            }}
            disabled={addPending}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              className="flex-1"
              onClick={handleAdd}
              disabled={selected.length === 0 || addPending}
            >
              {addPending ? 'Ajout…' : 'Ajouter'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setSelected([]);
                setPrimaryChurchId(null);
              }}
              disabled={addPending}
            >
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setAdding(true)}
        >
          Ajouter une église
        </Button>
      )}
    </div>
  );
}
