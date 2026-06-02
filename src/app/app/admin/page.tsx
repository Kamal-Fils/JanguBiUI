'use client';

import {
  BookOpen,
  Calendar,
  FileText,
  Settings2,
  Tv2,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { AppShell } from '@/components/layouts/app-shell';
import { PageHeader } from '@/components/layouts/page-header';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { canManageUsers, isAdmin, isSuperAdmin } from '@/lib/authorization';
import { cn } from '@/lib/utils';

interface AdminSection {
  label: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  visible: boolean;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { data: user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !isAdmin(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, isLoading, router]);

  if (isLoading || !isAdmin(user)) return null;

  const sections: AdminSection[] = [
    {
      label: 'Articles',
      description: 'Créer, éditer et publier les actualités',
      href: paths.app.admin.articles.getHref(),
      icon: BookOpen,
      color: 'bg-blue-500/10 text-blue-600',
      visible: true,
    },
    {
      label: 'Documents',
      description: 'Traiter les demandes de documents',
      href: paths.app.admin.documents.getHref(),
      icon: FileText,
      color: 'bg-amber-500/10 text-amber-600',
      visible: true,
    },
    {
      label: 'Agenda',
      description: 'Créer et gérer les événements',
      href: paths.app.admin.agenda.getHref(),
      icon: Calendar,
      color: 'bg-green-500/10 text-green-600',
      visible: true,
    },
    {
      label: 'Utilisateurs',
      description: 'Gérer les comptes et accès',
      href: paths.app.admin.users.list.getHref(),
      icon: Users,
      color: 'bg-purple-500/10 text-purple-600',
      visible: canManageUsers(user),
    },
    {
      label: 'JanguBi TV',
      description: 'Gérer les vidéos et catégories',
      href: paths.app.admin.tv.getHref(),
      icon: Tv2,
      color: 'bg-rose-500/10 text-rose-600',
      visible: isSuperAdmin(user),
    },
    {
      label: 'Structure',
      description: 'Provinces, diocèses et paroisses',
      href: paths.app.admin.org.getHref(),
      icon: Settings2,
      color: 'bg-gray-500/10 text-gray-600',
      visible: isSuperAdmin(user),
    },
  ].filter((s) => s.visible);

  return (
    <AppShell>
      <div className="flex flex-col">
        <PageHeader
          title="Administration"
          subtitle="Tableau de bord administrateur"
        />
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:max-w-3xl md:px-6 lg:max-w-5xl lg:px-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted active:scale-[0.98]"
                >
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl',
                      section.color,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {section.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground leading-tight">
                      {section.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
