'use client';

import { BookOpen, Clock, Cross, MapPin, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const CLERGE_SECTIONS = [
  {
    href: paths.app.clerge.intentions.getHref(),
    icon: Cross,
    label: 'Intentions de messe',
    description: 'Recevoir · Accepter · Célébrer',
    color: 'bg-amber-500/10 text-amber-600',
  },
  {
    href: paths.app.clerge.messages.getHref(),
    icon: MessageSquare,
    label: 'Messagerie inter-clergé',
    description: 'Correspondance · Annonces · Directives',
    color: 'bg-blue-500/10 text-blue-600',
  },
  {
    href: paths.app.clerge.transferts.getHref(),
    icon: MapPin,
    label: 'Transferts paroissiaux',
    description: 'Gérer les demandes de changement de paroisse',
    color: 'bg-teal-500/10 text-teal-600',
  },
  {
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    label: 'Liturgie des Heures',
    description: 'Laudes · Vêpres · Complies · 7 offices',
    color: 'bg-orange-500/10 text-orange-500',
  },
  {
    href: paths.app.spirituel.getHref(),
    icon: BookOpen,
    label: 'Spiritualité',
    description: 'Bible · Chapelet · Liturgie du jour',
    color: 'bg-primary/10 text-primary',
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

  if (isLoading || !isClergy(user)) {
    return null;
  }

  return (
    <AppShell>
    <div className="flex flex-col">
      <PageHeader
        title="Espace Clergé"
        subtitle="Outils et ressources pastoraux"
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
        <div className="flex flex-col gap-3">
          {CLERGE_SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link
                key={section.href}
                href={section.href}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted active:scale-[0.98]"
              >
                <div
                  className={cn(
                    'flex size-12 flex-shrink-0 items-center justify-center rounded-xl',
                    section.color,
                  )}
                >
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">
                    {section.label}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <svg
                  className="size-4 flex-shrink-0 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
    </AppShell>
  );
}
