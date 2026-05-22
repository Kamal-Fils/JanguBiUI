'use client';

import { Heart, MapPin, MessageCircle, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import { PageHeader } from '@/components/layouts/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { paths } from '@/config/paths';
import type { Minister } from '../api/get-ministers';
import { useMinisters } from '../api/get-ministers';

// ── Role config ───────────────────────────────────────────────────────────────

type RoleFilter = 'all' | NonNullable<Minister['role']>;

const ROLE_OPTIONS: { key: RoleFilter; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'PRIEST', label: 'Prêtres' },
  { key: 'DEACON', label: 'Diacres' },
  { key: 'SISTER', label: 'Sœurs' },
  { key: 'RELIGIOUS', label: 'Religieux' },
  { key: 'BISHOP', label: 'Évêques' },
];

// ── Minister card ─────────────────────────────────────────────────────────────

function MinisterCard({ minister, onDon }: { minister: Minister; onDon: () => void }) {
  const initials = [minister.first_name?.[0], minister.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-start gap-4">
        {minister.photo ? (
          <img
            src={minister.photo}
            alt={`${minister.first_name} ${minister.last_name}`}
            className="size-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="flex size-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initials}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground">
            {minister.first_name} {minister.last_name}
          </h3>
          <p className="text-xs text-primary font-medium">{minister.role_display}</p>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3 flex-shrink-0" />
            <span className="truncate">
              {minister.parish.name} — {minister.parish.city}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          href={paths.app.messages.getHref()}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MessageCircle className="size-3.5" />
          Contacter
        </Link>
        <button
          type="button"
          onClick={onDon}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Heart className="size-3.5 text-rose-500" />
          Don
        </button>
      </div>
    </div>
  );
}

// ── Don dialog ────────────────────────────────────────────────────────────────

const SUGGESTED_AMOUNTS = [500, 1000, 2000, 5000];

function DonDialog({ minister, onClose }: { minister: Minister; onClose: () => void }) {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  const finalAmount = customAmount ? parseInt(customAmount, 10) : selectedAmount;

  const handleConfirm = () => {
    setConfirmed(true);
    timerRef.current = setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-foreground/40" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-card p-6 sm:rounded-2xl">
        {confirmed ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex size-14 items-center justify-center rounded-full bg-green-100">
              <Heart className="size-7 text-green-600" />
            </div>
            <p className="text-base font-semibold">Merci !</p>
            <p className="text-center text-sm text-muted-foreground">
              Don de {finalAmount?.toLocaleString()} FCFA pour {minister.first_name}{' '}
              {minister.last_name} enregistré.
            </p>
          </div>
        ) : (
          <>
            <h3 className="mb-4 text-base font-semibold">Don de soutien</h3>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {SUGGESTED_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => { setSelectedAmount(amount); setCustomAmount(''); }}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
                    selectedAmount === amount && !customAmount
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {amount.toLocaleString()} FCFA
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Montant libre (FCFA)"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0); }}
              className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              disabled={!finalAmount || finalAmount <= 0}
              onClick={handleConfirm}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              Confirmer — {finalAmount ? `${finalAmount.toLocaleString()} FCFA` : '…'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function MinisterSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton className="size-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AlloPretreContent() {
  const { data: ministers = [], isLoading, isError } = useMinisters();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [search, setSearch] = useState('');
  const [donTarget, setDonTarget] = useState<Minister | null>(null);

  const filtered = ministers.filter((m) => {
    if (!m.is_active) return false;
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (search) {
      const query = search.toLowerCase();
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase();
      const parishName = m.parish.name.toLowerCase();
      const city = m.parish.city.toLowerCase();
      if (!fullName.includes(query) && !parishName.includes(query) && !city.includes(query)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="flex flex-col">
      <PageHeader title="Allo Prêtre" subtitle="Contactez un guide spirituel" />

      <div className="mx-auto w-full max-w-2xl px-4 py-4 space-y-4 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Rechercher par nom, paroisse ou ville…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Role filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ROLE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRoleFilter(opt.key)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                roleFilter === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <MinisterSkeleton key={i} />)}
          </div>
        )}

        {isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="text-sm text-destructive">
              Impossible de charger la liste. Veuillez réessayer.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <p className="text-xs text-muted-foreground">
              {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun résultat avec ces filtres.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((minister) => (
                  <MinisterCard
                    key={minister.id}
                    minister={minister}
                    onDon={() => setDonTarget(minister)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {donTarget && (
        <DonDialog minister={donTarget} onClose={() => setDonTarget(null)} />
      )}
    </div>
  );
}
