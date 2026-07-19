'use client';

import { ArrowRight, BookOpen, Clock, MessageCircle, Sun } from 'lucide-react';
import Link from 'next/link';

import { paths } from '@/config/paths';
import { cn } from '@/lib/utils';

/**
 * Accès rapide de l'accueil générique (utilisateur sans rôle identifié).
 *
 * Les liens passent tous par `paths` : les anciens `href` en dur pointaient
 * vers des onglets Bible supprimés depuis (`/app/bible?tab=heures`), si bien
 * que « Liturgie » atterrissait sur la liste des livres au lieu des offices.
 */
const regularLinks = [
  {
    label: 'Bible',
    description: 'Ancien & Nouveau Testament',
    href: paths.app.bible.getHref(),
    icon: BookOpen,
    iconClass: 'bg-primary/10 text-primary',
    borderClass: 'border-t-primary/40',
  },
  {
    label: 'Liturgie du jour',
    description: 'Les lectures d’aujourd’hui',
    href: paths.app.spirituelLiturgie.getHref(),
    icon: Sun,
    iconClass: 'bg-accent/15 text-gold-ink',
    borderClass: 'border-t-accent/40',
  },
  {
    label: 'Les Heures',
    description: 'Les sept offices du jour',
    href: paths.app.spirituelHeures.getHref(),
    icon: Clock,
    iconClass: 'bg-info/10 text-info',
    borderClass: 'border-t-info/40',
  },
] as const;

export function QuickAccessGrid() {
  return (
    <section aria-label="Accès rapide" className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Accès rapide
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {regularLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                'group flex flex-col gap-3 rounded-2xl border border-t-2 border-border bg-card p-4',
                'transition-[transform,box-shadow] duration-[var(--duration-normal)] ease-out-soft hover:-translate-y-0.5 hover:shadow-soft motion-reduce:transform-none',
                link.borderClass,
              )}
            >
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105 motion-reduce:transform-none',
                  link.iconClass,
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground">
                  {link.label}
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {link.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Carte mise en avant — Assistant spirituel */}
      <Link
        href={paths.app.assistant.getHref()}
        className="group relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/12 via-primary/5 to-accent/5 p-5 transition-[transform,box-shadow,border-color] duration-[var(--duration-normal)] ease-out-soft hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft motion-reduce:transform-none"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-6 -top-6 size-28 rounded-full bg-primary/10"
        />

        <div className="relative flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft-sm transition-transform group-hover:scale-105 motion-reduce:transform-none">
            <MessageCircle className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block font-serif text-base font-bold text-foreground">
              Assistant spirituel
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Posez vos questions sur la Bible, le chapelet ou trouvez un prêtre
            </span>
          </div>
          <ArrowRight
            className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 motion-reduce:transform-none"
            aria-hidden="true"
          />
        </div>
      </Link>
    </section>
  );
}
