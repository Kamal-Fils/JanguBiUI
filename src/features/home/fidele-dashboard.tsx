'use client';

import { BookOpen, ScrollText } from 'lucide-react';
import Link from 'next/link';

import { ContentContainer } from '@/components/layouts/content-container';
import { SectionHeader } from '@/components/ui/section-header';
import { FideleSummarySection } from '@/features/dashboard/components/fidele-summary-section';
import { PastoralReflectionWidget } from '@/features/reflexion-pastorale/components/pastoral-reflection-widget';
import { cn } from '@/utils/cn';

import { DailyReadingCard } from './daily-reading-card';
import { MyIntentionsSection } from './my-intentions-section';
import { ParishEventsSection } from './parish-events-section';
import { ParishNewsSection } from './parish-news-section';
import { WelcomeBanner } from './welcome-banner';

const QUICK_ACTIONS = [
  {
    label: 'Spiritualité',
    href: '/app/spirituel',
    icon: BookOpen,
    className: 'bg-primary/10 text-primary',
  },
  {
    label: 'Intentions',
    href: '/app/intentions',
    icon: ScrollText,
    className: 'bg-accent/15 text-accent',
  },
] as const;

export function FideleDashboard() {
  return (
    <ContentContainer width="wide">
      <div className="flex flex-col gap-8">
        <WelcomeBanner />

        {/* Lecture du jour — carte éditoriale pleine largeur */}
        <DailyReadingCard />

        {/* Accès rapides */}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-4 shadow-soft-sm transition-all hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.97] motion-reduce:transform-none"
              >
                <div
                  className={cn(
                    'flex size-11 items-center justify-center rounded-xl',
                    action.className,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-center text-xs font-medium leading-tight text-foreground">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Résumé (stats) — pleine largeur */}
        <FideleSummarySection />

        <div className="hairline-gold" aria-hidden="true" />

        {/* Bento éditorial : actualité + agenda (2/3) · réflexion + intentions (1/3) */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col gap-8 lg:col-span-2">
            <section>
              <SectionHeader
                eyebrow="Vie de la communauté"
                title="Ma paroisse"
                actionHref="/app/actus"
              />
              <ParishNewsSection />
            </section>
            <section>
              <SectionHeader
                eyebrow="Calendrier"
                title="Événements à venir"
                actionHref="/app/agenda"
                actionLabel="Agenda"
              />
              <ParishEventsSection />
            </section>
          </div>
          <div className="flex flex-col gap-8">
            <section>
              <SectionHeader eyebrow="Méditation" title="Réflexion du jour" />
              <PastoralReflectionWidget />
            </section>
            <section>
              <SectionHeader
                eyebrow="Prière"
                title="Mes intentions"
                actionHref="/app/intentions"
              />
              <MyIntentionsSection />
            </section>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
