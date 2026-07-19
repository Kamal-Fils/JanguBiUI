'use client';

import { Play, Tv } from 'lucide-react';
import { useMemo, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { PageHeader } from '@/components/layouts/page-header';
import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterPills } from '@/components/ui/filter-pills';
import { SectionHeader } from '@/components/ui/section-header';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

import { useTvCategories } from '../api/get-categories';
import { useTvVideos } from '../api/get-videos';
import type { TvVideo } from '../types';
import { youtubeThumbnail } from '../utils/youtube-thumbnail';

/**
 * Filet éditorial **bleu** — même recette que le fil d'actualité. Le bleu est
 * l'identité (DIRECTION.md R4) : l'or ne sert plus de séparateur par défaut.
 * Dupliqué plutôt qu'importé : une feature ne peut pas en importer une autre.
 */
const RULE_CLASS =
  'h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent';

/** Nombre de bandes pleine largeur avant de basculer en brèves. */
const BAND_COUNT = 3;

// ── Indicateur direct ────────────────────────────────────────────────────────

/**
 * « En direct » : un ÉTAT, donc une couleur sémantique (rouge), jamais l'or
 * décoratif. Le libellé porte le sens — la couleur ne le porte jamais seule
 * (WCAG 1.4.1).
 */
function LiveIndicator() {
  return (
    <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-destructive px-2.5 py-1 text-[11px] font-bold uppercase tracking-widest text-destructive-foreground shadow-soft-sm">
      <span className="relative flex size-1.5" aria-hidden="true">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive-foreground/70 motion-reduce:animate-none" />
        <span className="relative inline-flex size-1.5 rounded-full bg-destructive-foreground" />
      </span>
      En direct
    </span>
  );
}

// ── Façade de lecture ────────────────────────────────────────────────────────

type Variant = 'lead' | 'band' | 'brief';

/** Diamètre du bouton de lecture selon le mouvement — l'échelle dit le rang. */
const PLAY_SIZE: Record<Variant, string> = {
  lead: 'size-16',
  band: 'size-12',
  brief: 'size-9',
};

interface FacadeProps {
  video: TvVideo;
  variant: Variant;
  playing: boolean;
  onPlay: () => void;
}

/**
 * Vignette cliquable : on n'embarque l'`<iframe>` qu'au clic, pour ne pas
 * démarrer N lecteurs à la fois. L'affordance de lecture est **bleue** : le
 * bleu porte l'identité ET l'action (R4).
 */
function Facade({ video, variant, playing, onPlay }: FacadeProps) {
  const thumbnail = youtubeThumbnail(video);

  if (playing) {
    return (
      <iframe
        src={`${video.embed_url}${video.embed_url.includes('?') ? '&' : '?'}autoplay=1`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="size-full"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Lire la vidéo : ${video.title}`}
      className="relative flex size-full items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-[1.03] motion-reduce:transform-none"
        />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-background-subtle" />
      )}
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent transition-colors group-hover:from-black/60"
      />
      <span
        className={cn(
          'relative flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft transition-transform group-hover:scale-110 motion-reduce:transform-none',
          PLAY_SIZE[variant],
        )}
      >
        <Play
          className={cn(
            'translate-x-0.5 fill-current',
            variant === 'lead'
              ? 'size-7'
              : variant === 'band'
                ? 'size-5'
                : 'size-4',
          )}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

// ── Cartes par mouvement ─────────────────────────────────────────────────────

interface VideoItemProps {
  video: TvVideo;
  /** Inverse le sens de la bande (vignette à droite) — rythme irrégulier. */
  reverse?: boolean;
}

/**
 * **La une** — panoramique pleine largeur, titre à la plus grande échelle de la
 * page. Elle doit écraser le reste : c'est elle qui donne le sujet sans lire (R2).
 */
function LeadVideo({ video }: VideoItemProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-soft md:aspect-[21/9]">
        {video.is_live && !playing && <LiveIndicator />}
        <Facade
          video={video}
          variant="lead"
          playing={playing}
          onPlay={() => setPlaying(true)}
        />
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground dark:text-primary">
        {video.category.name}
      </p>
      <h3 className="mt-1.5 font-serif text-2xl font-bold leading-tight tracking-tight text-foreground md:text-3xl">
        {video.title || '(sans titre)'}
      </h3>
    </article>
  );
}

/**
 * **Une bande** — pleine largeur, vignette alternée gauche/droite. Jamais deux
 * côte à côte : la lecture reste verticale et le regard change de côté.
 */
function BandVideo({ video, reverse }: VideoItemProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <article
      className={cn('group flex gap-4 md:gap-6', reverse && 'flex-row-reverse')}
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg border border-border bg-black shadow-soft-sm sm:w-48 md:w-[38%]">
        {video.is_live && !playing && <LiveIndicator />}
        <Facade
          video={video}
          variant="band"
          playing={playing}
          onPlay={() => setPlaying(true)}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {video.category.name}
        </p>
        <h3 className="mt-1 line-clamp-3 font-serif text-lg font-semibold leading-snug text-foreground md:text-xl">
          {video.title || '(sans titre)'}
        </h3>
      </div>
    </article>
  );
}

/** **En bref** — ligne dense : la vignette n'est plus qu'un repère. */
function BriefVideo({ video }: VideoItemProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <article className="group flex items-center gap-3.5 py-3">
      <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-md border border-border bg-black sm:w-28">
        <Facade
          video={video}
          variant="brief"
          playing={playing}
          onPlay={() => setPlaying(true)}
        />
      </div>
      <h3 className="line-clamp-2 min-w-0 flex-1 font-serif text-[15px] font-semibold leading-snug text-foreground">
        {video.title || '(sans titre)'}
      </h3>
    </article>
  );
}

// ── Rythme ───────────────────────────────────────────────────────────────────

interface VideoRhythmProps {
  videos: TvVideo[];
  /** La première vidéo prend le traitement « une ». */
  withLead?: boolean;
}

/**
 * Trois mouvements de densité décroissante — la une, les bandes, les brèves —
 * exactement comme le fil d'actualité. C'est ce tempo qui distingue l'archétype
 * **Flux** d'une grille de cartes identiques (DIRECTION.md R6).
 */
function VideoRhythm({ videos, withLead = false }: VideoRhythmProps) {
  const lead = withLead ? videos[0] : undefined;
  const rest = withLead ? videos.slice(1) : videos;
  const bands = rest.slice(0, BAND_COUNT);
  const briefs = rest.slice(BAND_COUNT);

  return (
    <div className="flex flex-col">
      {lead && <LeadVideo video={lead} />}

      {lead && bands.length > 0 && (
        <div className={cn(RULE_CLASS, 'my-7')} aria-hidden="true" />
      )}

      {bands.length > 0 && (
        <div className="flex flex-col">
          {bands.map((video, index) => (
            <div
              key={video.id}
              className={index > 0 ? 'mt-6 border-t border-border pt-6' : ''}
            >
              <BandVideo video={video} reverse={index % 2 === 1} />
            </div>
          ))}
        </div>
      )}

      {briefs.length > 0 && (
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {briefs.map((video) => (
            <li key={video.id}>
              <BriefVideo video={video} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Squelette : miroir du rythme réel (une → bandes), pas d'une grille. */
function TvSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-video w-full rounded-2xl md:aspect-[21/9]" />
      <Skeleton className="mt-4 h-3.5 w-24" />
      <Skeleton className="mt-3 h-8 w-4/5" />

      <div className="mt-9 flex flex-col gap-6">
        {Array.from({ length: BAND_COUNT }).map((_, i) => (
          <div key={i} className="flex gap-4 md:gap-6">
            <Skeleton className="aspect-video w-32 shrink-0 rounded-lg sm:w-48 md:w-[38%]" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="mt-2.5 h-6 w-11/12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Écran ────────────────────────────────────────────────────────────────────

interface CategorySection {
  slug: string;
  name: string;
  videos: TvVideo[];
}

export function TvContent() {
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  const {
    data: cats,
    isLoading: catsLoading,
    isError: catsError,
    refetch: refetchCategories,
  } = useTvCategories();
  const {
    data: videos,
    isLoading: vidsLoading,
    isError: vidsError,
    refetch: refetchVideos,
  } = useTvVideos(selectedSlug || undefined);

  const sortedVideos = useMemo<TvVideo[]>(() => {
    if (!videos?.results) return [];
    return [...videos.results].sort((a, b) => {
      if (a.is_pinned_live && !b.is_pinned_live) return -1;
      if (!a.is_pinned_live && b.is_pinned_live) return 1;
      if (a.is_live && !b.is_live) return -1;
      if (!a.is_live && b.is_live) return 1;
      return 0;
    });
  }, [videos]);

  // Lives mis en avant (toutes catégories confondues, vue « Tous »).
  const liveVideos = useMemo<TvVideo[]>(
    () => sortedVideos.filter((v) => v.is_live),
    [sortedVideos],
  );

  // Regroupement par catégorie pour la vue « Tous » (en respectant l'ordre
  // déclaré des catégories), lives exclus pour éviter le doublon.
  const sections = useMemo<CategorySection[]>(() => {
    if (selectedSlug) return [];
    const replayable = sortedVideos.filter((v) => !v.is_live);
    const bySlug = new Map<string, CategorySection>();
    for (const video of replayable) {
      const { slug, name } = video.category;
      if (!bySlug.has(slug)) bySlug.set(slug, { slug, name, videos: [] });
      bySlug.get(slug)!.videos.push(video);
    }
    const order = cats?.results.map((c) => c.slug) ?? [];
    return [...bySlug.values()].sort(
      (a, b) => order.indexOf(a.slug) - order.indexOf(b.slug),
    );
  }, [selectedSlug, sortedVideos, cats]);

  const filterOptions = [
    { value: '', label: 'Tous' },
    ...(cats?.results.map((c) => ({ value: c.slug, label: c.name })) ?? []),
  ];

  const selectedCategory = cats?.results.find((c) => c.slug === selectedSlug);

  const isLoading = vidsLoading || catsLoading;
  const isError = vidsError || catsError;
  const isEmpty = !isLoading && !isError && !sortedVideos.length;
  const showGroupedView = !selectedSlug;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Jàngu Bi TV"
        subtitle="La parole en images — programmes, lives et formations"
      />

      <ContentContainer>
        <div className="mb-6">
          <FilterPills
            options={filterOptions}
            value={selectedSlug}
            onChange={setSelectedSlug}
            ariaLabel="Catégories TV"
          />
        </div>

        {isLoading ? (
          <TvSkeleton />
        ) : isError ? (
          <ErrorState
            title="Impossible de charger les programmes"
            description="Vérifiez votre connexion puis réessayez."
            onRetry={() => {
              refetchCategories();
              refetchVideos();
            }}
          />
        ) : isEmpty ? (
          <EmptyState
            icon={<Tv aria-hidden="true" />}
            title={
              selectedCategory
                ? `Rien dans « ${selectedCategory.name} » pour l'instant`
                : 'Les premiers programmes arrivent'
            }
            description={
              selectedCategory
                ? 'Les prochaines vidéos de cette catégorie apparaîtront ici dès leur mise en ligne. En attendant, explorez le reste de la chaîne.'
                : 'Messes, enseignements, témoignages… La chaîne Jàngu Bi TV se remplit régulièrement. Revenez bientôt pour découvrir les premières vidéos.'
            }
            action={
              selectedCategory ? (
                <Button variant="outline" onClick={() => setSelectedSlug('')}>
                  Voir toutes les vidéos
                </Button>
              ) : undefined
            }
          />
        ) : showGroupedView ? (
          <div className="flex flex-col gap-12">
            {liveVideos.length > 0 && (
              <section>
                <SectionHeader
                  eyebrow="À l'antenne"
                  title="En direct maintenant"
                  description="Suivez les célébrations et événements en direct."
                  hairline={false}
                />
                <div
                  className={cn(RULE_CLASS, '-mt-1.5 mb-5')}
                  aria-hidden="true"
                />
                <VideoRhythm videos={liveVideos} withLead />
              </section>
            )}
            {sections.map((section, index) => (
              <section key={section.slug}>
                <SectionHeader
                  eyebrow="Catégorie"
                  title={section.name}
                  hairline={false}
                />
                <div
                  className={cn(RULE_CLASS, '-mt-1.5 mb-5')}
                  aria-hidden="true"
                />
                {/* Une seule « une » par page : elle revient à la première
                    catégorie quand aucun direct ne l'a déjà prise. */}
                <VideoRhythm
                  videos={section.videos}
                  withLead={index === 0 && liveVideos.length === 0}
                />
              </section>
            ))}
          </div>
        ) : (
          <VideoRhythm videos={sortedVideos} withLead />
        )}
      </ContentContainer>
    </div>
  );
}
