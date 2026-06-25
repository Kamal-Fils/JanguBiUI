'use client';

import { BookOpen, ChevronRight, Clock, Flame, Tv2 } from 'lucide-react';
import Link from 'next/link';

import { PageHeader } from '@/components/layouts/page-header';
import {
  Card,
  CardEyebrow,
  CardTitle,
  CardDescription,
} from '@/components/ui/card/card';
import { ScriptureQuote } from '@/components/ui/scripture-quote';
import { SectionHeader } from '@/components/ui/section-header';
import { paths } from '@/config/paths';
import { cn } from '@/utils/cn';

// Surtitre éditorial + accent (or / indigo) de la pastille d'icône par section.
type SectionTone = 'gold' | 'indigo';

interface SpirituelSection {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  label: string;
  description: string;
  tone: SectionTone;
  /** Carte mise en avant (variante éditoriale `feature`). */
  featured?: boolean;
}

// Pastille d'icône teintée : carré arrondi or ou indigo, ton sur ton.
const TONE_TILE: Record<SectionTone, string> = {
  gold: 'bg-accent/12 text-accent',
  indigo: 'bg-primary/10 text-primary',
};

function RosaryIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="3" r="1.5" />
      <circle cx="12" cy="21" r="1.5" />
      <circle cx="3" cy="12" r="1.5" />
      <circle cx="21" cy="12" r="1.5" />
      <line x1="12" y1="4.5" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="19.5" />
      <line x1="4.5" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="19.5" y2="12" />
    </svg>
  );
}

const sections: SpirituelSection[] = [
  {
    href: '/app/bible?tab=bible',
    icon: BookOpen,
    eyebrow: 'Parole de Dieu',
    label: 'Bible',
    description: 'Lectures du jour · Navigation complète',
    tone: 'indigo',
    featured: true,
  },
  {
    href: paths.app.chapelet.getHref(),
    icon: RosaryIcon,
    eyebrow: 'Prière mariale',
    label: 'Chapelet',
    description: 'Mystère du jour · Guide de prière',
    tone: 'gold',
  },
  {
    href: paths.app.spirituelLiturgie.getHref(),
    icon: Flame,
    eyebrow: 'Messe du jour',
    label: 'Liturgie du Jour',
    description: 'Lectures · Évangile · Messe du jour',
    tone: 'gold',
  },
  {
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    eyebrow: 'Office divin',
    label: 'Liturgie des Heures',
    description: 'Laudes · Vêpres · Complies · 7 offices',
    tone: 'indigo',
  },
  {
    href: paths.app.tv.getHref(),
    icon: Tv2,
    eyebrow: 'En direct',
    label: 'TV Catholique',
    description: 'En direct · Replays par catégorie',
    tone: 'indigo',
  },
];

interface SectionCardProps {
  section: SpirituelSection;
}

function SectionCard({ section }: SectionCardProps) {
  const Icon = section.icon;
  return (
    <Link
      href={section.href}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        variant={section.featured ? 'feature' : 'sacred'}
        className={cn(
          'flex items-center gap-4 p-5 transition-transform hover:-translate-y-0.5 active:scale-[0.99] motion-reduce:transform-none',
          section.featured && 'p-6',
        )}
      >
        <div
          className={cn(
            'flex flex-shrink-0 items-center justify-center rounded-2xl',
            section.featured ? 'size-16' : 'size-14',
            TONE_TILE[section.tone],
          )}
        >
          <Icon className={section.featured ? 'size-8' : 'size-7'} />
        </div>
        <div className="min-w-0 flex-1">
          <CardEyebrow>{section.eyebrow}</CardEyebrow>
          <CardTitle
            className={cn(
              'mt-1 font-serif',
              section.featured ? 'text-xl' : 'text-lg',
            )}
          >
            {section.label}
          </CardTitle>
          <CardDescription className="mt-1 truncate">
            {section.description}
          </CardDescription>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none" />
      </Card>
    </Link>
  );
}

export function SpirituelContent() {
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Spiritualité"
        subtitle="Nourriture de l'âme au quotidien"
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-8 md:max-w-3xl md:px-6 md:py-10 lg:max-w-5xl lg:px-8">
        {/* Citation d'ouverture — pose le ton éditorial du hub. */}
        <ScriptureQuote
          eyebrow="Méditation"
          text="Ta parole est une lampe pour mes pas, une lumière sur ma route."
          reference="Psaume 119, 105"
          size="md"
          className="mb-8"
        />

        <SectionHeader
          eyebrow="Spiritualité"
          title="Vivre la foi au quotidien"
          description="Cinq portes pour nourrir votre vie de prière."
        />

        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <SectionCard key={section.href} section={section} />
          ))}
        </div>
      </div>
    </div>
  );
}
