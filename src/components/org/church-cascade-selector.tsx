'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChurches } from '@/lib/org/get-churches';
import { useDioceses } from '@/lib/org/get-dioceses';
import { useParishes } from '@/lib/org/get-parishes';

export interface SelectedChurch {
  churchId: number;
  label: string;
}

interface ChurchCascadeSelectorProps {
  selected: SelectedChurch[];
  primaryChurchId: number | null;
  onChange: (selected: SelectedChurch[], primaryChurchId: number | null) => void;
  disabled?: boolean;
}

/**
 * Cascade RÉPÉTABLE Diocèse → Paroisse (filtre ville optionnel) → Église, en
 * multi-sélection : l'utilisateur ajoute plusieurs églises (de diocèses/paroisses
 * différents) et en désigne une PRINCIPALE (défaut = 1re ajoutée).
 */
export function ChurchCascadeSelector({
  selected,
  primaryChurchId,
  onChange,
  disabled = false,
}: ChurchCascadeSelectorProps) {
  const [dioceseId, setDioceseId] = useState<number | undefined>();
  const [city, setCity] = useState('');
  const [parishId, setParishId] = useState<number | undefined>();
  const [churchId, setChurchId] = useState<number | undefined>();

  const { data: dioceses = [], isLoading: loadingDioceses } = useDioceses();
  const { data: parishes = [], isLoading: loadingParishes } = useParishes({
    dioceseId,
    city: city || undefined,
  });
  const { data: churches = [], isLoading: loadingChurches } = useChurches({
    parishId,
  });

  const dioceseName = dioceses.find((d) => d.id === dioceseId)?.name ?? '';
  const parish = parishes.find((p) => p.id === parishId);
  const church = churches.find((c) => c.id === churchId);

  const alreadyAdded = (id: number) => selected.some((s) => s.churchId === id);

  const handleAdd = () => {
    if (!church || alreadyAdded(church.id)) return;
    const cityPart = parish?.city ? ` (${parish.city})` : '';
    const label = `${church.name} — ${parish?.name ?? ''}${cityPart} · ${dioceseName}`;
    const next = [...selected, { churchId: church.id, label }];
    // 1re église ajoutée → principale par défaut.
    const nextPrimary = primaryChurchId ?? church.id;
    onChange(next, nextPrimary);
    setChurchId(undefined);
  };

  const handleRemove = (id: number) => {
    const next = selected.filter((s) => s.churchId !== id);
    const nextPrimary =
      primaryChurchId === id ? (next[0]?.churchId ?? null) : primaryChurchId;
    onChange(next, nextPrimary);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border p-4">
        <div>
          <label
            htmlFor="cascade-diocese"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Diocèse
          </label>
          <Select
            onValueChange={(v) => {
              setDioceseId(Number(v));
              setParishId(undefined);
              setChurchId(undefined);
            }}
            disabled={disabled || loadingDioceses}
          >
            <SelectTrigger id="cascade-diocese">
              <SelectValue placeholder="Sélectionner un diocèse" />
            </SelectTrigger>
            <SelectContent>
              {dioceses.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="cascade-city"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Ville (filtre optionnel)
          </label>
          <input
            id="cascade-city"
            type="text"
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setParishId(undefined);
              setChurchId(undefined);
            }}
            disabled={disabled || !dioceseId}
            placeholder="Filtrer par ville"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="cascade-parish"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Paroisse
          </label>
          <Select
            value={parishId ? String(parishId) : undefined}
            onValueChange={(v) => {
              setParishId(Number(v));
              setChurchId(undefined);
            }}
            disabled={disabled || !dioceseId || loadingParishes}
          >
            <SelectTrigger id="cascade-parish">
              <SelectValue placeholder="Sélectionner une paroisse" />
            </SelectTrigger>
            <SelectContent>
              {parishes.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                  {p.city ? ` — ${p.city}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label
            htmlFor="cascade-church"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Église
          </label>
          <Select
            value={churchId ? String(churchId) : undefined}
            onValueChange={(v) => setChurchId(Number(v))}
            disabled={disabled || !parishId || loadingChurches}
          >
            <SelectTrigger id="cascade-church">
              <SelectValue placeholder="Sélectionner une église" />
            </SelectTrigger>
            <SelectContent>
              {churches.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                  {c.is_main ? ' ★' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          className="w-full"
          onClick={handleAdd}
          disabled={disabled || !churchId || (church != null && alreadyAdded(church.id))}
        >
          Ajouter cette église
        </Button>
      </div>

      {selected.length > 0 && (
        <ul className="space-y-2" aria-label="Églises sélectionnées">
          {selected.map((s) => (
            <li
              key={s.churchId}
              className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
            >
              <span className="text-sm text-foreground">{s.label}</span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(selected, s.churchId)}
                  aria-pressed={primaryChurchId === s.churchId}
                  disabled={disabled}
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    primaryChurchId === s.churchId
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {primaryChurchId === s.churchId ? 'Principale' : 'Définir principale'}
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(s.churchId)}
                  aria-label={`Retirer ${s.label}`}
                  disabled={disabled}
                  className="text-lg leading-none text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
