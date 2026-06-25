'use client';

import { BookOpen, Clock, Cross, MapPin, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { QuickActionTile } from '@/components/ui/quick-action-tile';
import { SectionHeader } from '@/components/ui/section-header';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

const CLERGE_SECTIONS = [
  {
    href: paths.app.clerge.intentions.getHref(),
    icon: Cross,
    label: 'Intentions de messe',
    description: 'Recevoir · Accepter · Célébrer',
    tone: 'warning' as const,
  },
  {
    href: paths.app.clerge.messages.getHref(),
    icon: MessageSquare,
    label: 'Messagerie inter-clergé',
    description: 'Correspondance · Annonces · Directives',
    tone: 'info' as const,
  },
  {
    href: paths.app.clerge.transferts.getHref(),
    icon: MapPin,
    label: 'Transferts paroissiaux',
    description: 'Gérer les demandes de changement de paroisse',
    tone: 'success' as const,
  },
  {
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    label: 'Liturgie des Heures',
    description: 'Laudes · Vêpres · Complies · 7 offices',
    tone: 'gold' as const,
  },
  {
    href: paths.app.spirituel.getHref(),
    icon: BookOpen,
    label: 'Spiritualité',
    description: 'Bible · Chapelet · Liturgie du jour',
    tone: 'primary' as const,
  },
] as const;

export default function ClergePage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !isClergy(user)) {
      router.replace('/app');
    }
  }, [user, isLoading, router]);

  useRegisterPageMeta({
    title: 'Espace Clergé',
    subtitle: 'Outils et ressources pastoraux',
  });

  if (isLoading || !isClergy(user)) {
    return null;
  }

  const firstName = user?.profile?.first_name ?? '';

  return (
    <ContentContainer>
      <div className="flex flex-col gap-8">
        {/* Hero éditorial */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-7 text-primary-foreground shadow-glow-indigo motion-safe:animate-slide-up sm:p-9">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'radial-gradient(currentColor 0.6px, transparent 0.6px)',
                backgroundSize: '14px 14px',
              }}
            />
            <svg
              className="absolute -right-6 -top-10 size-56 text-primary-foreground/10 sm:size-64"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <rect x="10" y="2" width="4" height="20" rx="2" />
              <rect x="2" y="8" width="20" height="4" rx="2" />
            </svg>
          </div>

            <div className="relative">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
                Espace Clergé
              </p>
              <h1 className="mt-1 truncate font-serif text-display font-black italic leading-[0.95] text-primary-foreground">
                {firstName || 'Bienvenue'}
              </h1>
              <div
                className="mt-4 h-px w-16 rounded-full bg-gold/70"
                aria-hidden="true"
              />
              <p className="mt-3 text-sm text-primary-foreground/75">
                Outils et ressources pastoraux
              </p>
            </div>
          </div>

          {/* Outils pastoraux */}
          <section>
            <SectionHeader eyebrow="Ministère" title="Outils pastoraux" />
            <div className="flex flex-col gap-3">
              {CLERGE_SECTIONS.map((section) => {
                const Icon = section.icon;
                return (
                  <QuickActionTile
                    key={section.href}
                    href={section.href}
                    icon={<Icon />}
                    label={section.label}
                    description={section.description}
                    tone={section.tone}
                  />
                );
              })}
            </div>
          </section>
      </div>
    </ContentContainer>
  );
}
