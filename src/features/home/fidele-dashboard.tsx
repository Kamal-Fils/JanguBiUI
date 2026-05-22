'use client';

import { BookOpen, MessageCircle, Phone, ScrollText } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

import { MyIntentionsSection } from './my-intentions-section';
import { ParishEventsSection } from './parish-events-section';
import { ParishNewsSection } from './parish-news-section';
import { WelcomeBanner } from './welcome-banner';

const QUICK_ACTIONS = [
  {
    label: 'Spirituel',
    href: '/app/spirituel',
    icon: BookOpen,
    className: 'bg-primary/10 text-primary',
  },
  {
    label: 'Allo-Prêtre',
    href: '/app/allo-pretre',
    icon: Phone,
    className: 'bg-green-500/10 text-green-600',
  },
  {
    label: 'Intentions',
    href: '/app/intentions',
    icon: ScrollText,
    className: 'bg-amber-500/10 text-amber-600',
  },
  {
    label: 'Assistant',
    href: '/app/assistant',
    icon: MessageCircle,
    className: 'bg-purple-500/10 text-purple-600',
  },
] as const;

export function FideleDashboard() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
      <div className="flex flex-col gap-6">
        <WelcomeBanner />

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted active:scale-[0.97]"
              >
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    action.className,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <span className="text-center text-[11px] font-medium leading-tight text-foreground">
                  {action.label}
                </span>
              </Link>
            );
          })}
        </div>

        <ParishNewsSection />
        <ParishEventsSection />
        <MyIntentionsSection />
      </div>
    </div>
  );
}
