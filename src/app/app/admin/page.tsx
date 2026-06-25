'use client';

import {
  BookOpen,
  Calendar,
  ChevronRight,
  FileText,
  Settings2,
  Tv2,
  Users,
} from 'lucide-react';
import Link from 'next/link';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { SectionHeader } from '@/components/ui/section-header';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { canManageUsers, isAdmin, isSuperAdmin } from '@/lib/authorization';
import { cn } from '@/lib/utils';

interface AdminSection {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  tone: string;
  visible: boolean;
}

export default function AdminDashboardPage() {
  const { data: user } = useUser();

  const sections: AdminSection[] = [
    {
      label: 'Articles',
      description: 'Créer, éditer et publier les actualités',
      href: paths.app.admin.articles.getHref(),
      icon: BookOpen,
      tone: 'bg-primary/10 text-primary',
      visible: true,
    },
    {
      label: 'Documents',
      description: 'Traiter les demandes de documents',
      href: paths.app.admin.documents.getHref(),
      icon: FileText,
      tone: 'bg-warning/10 text-warning',
      visible: true,
    },
    {
      label: 'Agenda',
      description: 'Créer et gérer les événements',
      href: paths.app.admin.agenda.getHref(),
      icon: Calendar,
      tone: 'bg-success/10 text-success',
      visible: true,
    },
    {
      label: 'Utilisateurs',
      description: 'Gérer les comptes et accès',
      href: paths.app.admin.users.list.getHref(),
      icon: Users,
      tone: 'bg-accent/15 text-accent',
      visible: canManageUsers(user),
    },
    {
      label: 'JanguBi TV',
      description: 'Gérer les vidéos et catégories',
      href: paths.app.admin.tv.getHref(),
      icon: Tv2,
      tone: 'bg-destructive/10 text-destructive',
      visible: isSuperAdmin(user),
    },
    {
      label: 'Structure',
      description: 'Provinces, diocèses et paroisses',
      href: paths.app.admin.org.getHref(),
      icon: Settings2,
      tone: 'bg-info/10 text-info',
      visible: isSuperAdmin(user),
    },
  ].filter((s) => s.visible);

  return (
    <AdminPageLayout
      title="Administration"
      subtitle="Tableau de bord administrateur"
      allow={isAdmin}
    >
      <SectionHeader
        eyebrow="Administration"
        title="Pôles de gestion"
        description="Sélectionnez un espace pour piloter la plateforme."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border/60 bg-card p-4 shadow-soft-sm transition-[box-shadow,transform,border-color] duration-[var(--duration-normal)] ease-out-soft before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-gradient-to-r before:from-gold before:via-gold/70 before:to-transparent before:opacity-0 before:transition-opacity hover:-translate-y-0.5 hover:border-border hover:shadow-soft hover:before:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:hover:translate-y-0"
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-xl',
                    section.tone,
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <ChevronRight
                  aria-hidden="true"
                  className="size-4 -translate-x-1 text-muted-foreground/50 opacity-0 transition-all group-hover:translate-x-0 group-hover:text-accent group-hover:opacity-100"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-serif text-base font-bold tracking-tight text-foreground">
                  {section.label}
                </span>
                <span className="text-[11px] leading-tight text-muted-foreground">
                  {section.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </AdminPageLayout>
  );
}
