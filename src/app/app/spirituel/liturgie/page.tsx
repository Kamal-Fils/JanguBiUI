'use client';

import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'isomorphic-dompurify';
import { BookOpen, Flame, Moon, Sun } from 'lucide-react';

import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';

interface LiturgicalInfo {
  id: number;
  date: string;
  zone: string;
  day_name: string;
  season: string;
  mystery: string | null;
  notes: string | null;
  resource: { audio_url: string | null; youtube_url: string | null } | null;
}

interface Reading {
  id: number;
  type: string;
  citation: string;
  text: string;
}

interface Office {
  id: number;
  office_type: string;
  hymn: string;
  psalms: string;
  canticle: string;
  readings: string;
  intercessions: string;
}

const fetchInfo = (): Promise<LiturgicalInfo> =>
  api
    .get<unknown>('/v1/liturgy/v1/informations/')
    .then((d) => d as LiturgicalInfo);

const fetchReadings = (): Promise<Reading[]> =>
  api.get<unknown>('/v1/liturgy/v1/messes/').then((d) => d as Reading[]);

const fetchLaudes = (): Promise<Office | null> =>
  api
    .get<unknown>('/v1/liturgy/v1/laudes/')
    .then((d) => d as Office)
    .catch(() => null);

const fetchVepres = (): Promise<Office | null> =>
  api
    .get<unknown>('/v1/liturgy/v1/vepres/')
    .then((d) => d as Office)
    .catch(() => null);

function InfoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function ReadingCard({ reading }: { reading: Reading }) {
  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="bg-primary/5 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-primary">
            {reading.citation}
          </CardTitle>
          {reading.type && (
            <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {reading.type}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div
          className="prose prose-sm max-w-none text-foreground"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(reading.text) }}
        />
      </CardContent>
    </Card>
  );
}

function OfficeCard({
  office,
  icon,
  label,
  color,
}: {
  office: Office;
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  const sections = [
    { key: 'hymn', label: 'Hymne', value: office.hymn },
    { key: 'psalms', label: 'Psaumes', value: office.psalms },
    { key: 'canticle', label: 'Cantique', value: office.canticle },
    { key: 'readings', label: 'Lectures', value: office.readings },
    {
      key: 'intercessions',
      label: 'Intercessions',
      value: office.intercessions,
    },
  ].filter((s) => s.value);

  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className={`p-4 ${color}`}>
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-base">{label}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4">
        {sections.map((s) => (
          <div key={s.key}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(s.value) }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function LiturgiePage() {
  const { data: info, isLoading: loadingInfo } = useQuery({
    queryKey: ['liturgy', 'info'],
    queryFn: fetchInfo,
    retry: false,
  });

  const { data: readings, isLoading: loadingReadings } = useQuery({
    queryKey: ['liturgy', 'messes'],
    queryFn: fetchReadings,
    retry: false,
  });

  const { data: laudes, isLoading: loadingLaudes } = useQuery({
    queryKey: ['liturgy', 'laudes'],
    queryFn: fetchLaudes,
    retry: false,
  });

  const { data: vepres, isLoading: loadingVepres } = useQuery({
    queryKey: ['liturgy', 'vepres'],
    queryFn: fetchVepres,
    retry: false,
  });

  const isLoading =
    loadingInfo || loadingReadings || loadingLaudes || loadingVepres;

  useRegisterPageMeta({ title: 'Liturgie du jour' });

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        {/* Page title */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
            <Flame className="size-5 text-warning" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Liturgie du Jour
            </h1>
            {info && (
              <p className="text-sm text-muted-foreground">
                {info.day_name}
                {info.season ? ` · ${info.season}` : ''}
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <InfoSkeleton />
        ) : (
          <div className="flex flex-col gap-8">
            {/* Mass readings */}
            {readings && readings.length > 0 && (
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <BookOpen className="size-4 text-primary" />
                  Messe du jour
                </h2>
                {readings.map((reading) => (
                  <ReadingCard key={reading.id} reading={reading} />
                ))}
              </section>
            )}

            {/* Laudes */}
            {laudes && (
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Sun className="size-4 text-warning" />
                  Laudes
                </h2>
                <OfficeCard
                  office={laudes}
                  icon={<Sun className="size-4 text-warning" />}
                  label="Laudes — Prière du matin"
                  color="bg-warning/5"
                />
              </section>
            )}

            {/* Vêpres */}
            {vepres && (
              <section className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Moon className="size-4 text-info" />
                  Vêpres
                </h2>
                <OfficeCard
                  office={vepres}
                  icon={<Moon className="size-4 text-info" />}
                  label="Vêpres — Prière du soir"
                  color="bg-info/5"
                />
              </section>
            )}

            {/* Empty state */}
            {!readings?.length && !laudes && !vepres && (
              <div className="py-12 text-center">
                <Flame className="mx-auto mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Liturgie non disponible pour aujourd&apos;hui.
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Les données sont synchronisées automatiquement depuis AELF.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
