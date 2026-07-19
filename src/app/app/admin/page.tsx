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
import { paths } from '@/config/paths';
import { GlobalStatsSection } from '@/features/dashboard/components/global-stats-section';
import { useUser } from '@/lib/auth';
import { canManageUsers, isAdmin, isSuperAdmin } from '@/lib/authorization';

interface AdminSection {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  visible: boolean;
}

export default function AdminDashboardPage() {
  const { data: user } = useUser();

  // Pas de teinte par pôle : six couleurs décoratives ne disent rien (R4 — la
  // couleur porte un état, pas une catégorie) et transformaient un écran de
  // travail en nuancier.
  const sections: AdminSection[] = [
    {
      label: 'Articles',
      description: 'Créer, éditer et publier les actualités',
      href: paths.app.admin.articles.getHref(),
      icon: BookOpen,
      visible: true,
    },
    {
      label: 'Documents',
      description: 'Traiter les demandes de documents',
      href: paths.app.admin.documents.getHref(),
      icon: FileText,
      visible: true,
    },
    {
      label: 'Agenda',
      description: 'Créer et gérer les événements',
      href: paths.app.admin.agenda.getHref(),
      icon: Calendar,
      visible: true,
    },
    {
      label: 'Utilisateurs',
      description: 'Gérer les comptes et accès',
      href: paths.app.admin.users.list.getHref(),
      icon: Users,
      visible: canManageUsers(user),
    },
    {
      label: 'JanguBi TV',
      description: 'Gérer les vidéos et catégories',
      href: paths.app.admin.tv.getHref(),
      icon: Tv2,
      visible: isSuperAdmin(user),
    },
    {
      label: 'Structure',
      description: 'Provinces, diocèses et paroisses',
      href: paths.app.admin.org.getHref(),
      icon: Settings2,
      visible: isSuperAdmin(user),
    },
  ].filter((s) => s.visible);

  return (
    <AdminPageLayout
      title="Administration"
      subtitle="Tableau de bord administrateur"
      allow={isAdmin}
    >
      {/* Vue d'ensemble plateforme — réservée au super-admin (l'endpoint est
          403 pour les autres ; le guard évite même de tirer la requête).
          Section séparée du reste par une bordure adoucie. */}
      {isSuperAdmin(user) && (
        <section
          aria-label="Vue d'ensemble de la plateforme"
          className="mb-8 border-b border-border/60 pb-8"
        >
          <GlobalStatsSection />
        </section>
      )}

      {/* Archétype **Travail** : même vocabulaire que la file paroissiale
          (`/app/admin/documents`) — un titre de section discret, puis la
          matière. Les pôles sont une liste de destinations, pas une vitrine :
          rangées denses, cible ≥ 44 px, aucune animation de survol comme seule
          affordance (DIRECTION.md R3/R6). */}
      <section aria-labelledby="admin-poles-title">
        <h2
          id="admin-poles-title"
          className="mb-2 text-sm font-semibold text-foreground"
        >
          Pôles de gestion
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="group flex min-h-[60px] items-center gap-3.5 rounded-lg border border-border bg-card px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-secondary-foreground dark:group-hover:text-primary"
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">
                      {section.label}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {section.description}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </AdminPageLayout>
  );
}
