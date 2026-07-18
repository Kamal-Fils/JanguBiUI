'use client';

import { ChevronDown } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import * as React from 'react';

import { Link } from '@/components/ui/link/link';
import {
  buildNavSections,
  isSectionActive,
  isSubNavActive,
  type NavSection,
} from '@/config/nav-config';
import { useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

interface SidebarSectionsProps {
  /** Mode replié (icônes de section seules) — sidebar desktop uniquement. */
  collapsed?: boolean;
  /** Clic sur une section dépliable en mode replié → demande de dépliage. */
  onExpandRequest?: () => void;
  /** Appelé après navigation (fermeture du tiroir mobile). */
  onNavigate?: () => void;
}

interface SectionEntryProps {
  section: NavSection;
  pathname: string;
  /** Query params courants — active la discrimination `?type=` / `?tab=`. */
  currentParams: URLSearchParams | null;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
  onExpandRequest?: () => void;
  onNavigate?: () => void;
}

/** Une section : lien direct (feuille) ou groupe dépliable avec sous-navs. */
function SectionEntry({
  section,
  pathname,
  currentParams,
  collapsed,
  open,
  onToggle,
  onExpandRequest,
  onNavigate,
}: SectionEntryProps) {
  const Icon = section.icon;
  const active = isSectionActive(pathname, currentParams, section);

  const rowClass = cn(
    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
    collapsed && 'justify-center px-0',
    active
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
  );

  // Feuille — lien direct.
  if (section.href) {
    return (
      <li>
        <Link
          href={section.href}
          onClick={onNavigate}
          aria-current={active ? 'page' : undefined}
          aria-label={collapsed ? section.label : undefined}
          title={collapsed ? section.label : undefined}
          className={rowClass}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          {!collapsed && <span className="truncate">{section.label}</span>}
        </Link>
      </li>
    );
  }

  // Groupe dépliable. En mode replié, le clic redéplie la sidebar ET ouvre la
  // section (l'override d'ouverture est posé par le parent via onToggle).
  return (
    <li>
      <button
        type="button"
        onClick={() => {
          onToggle();
          if (collapsed) onExpandRequest?.();
        }}
        aria-expanded={open && !collapsed}
        aria-label={collapsed ? section.label : undefined}
        title={collapsed ? section.label : undefined}
        className={rowClass}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {!collapsed && (
          <>
            <span className="min-w-0 flex-1 truncate text-left">
              {section.label}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                'size-4 shrink-0 transition-transform',
                open && 'rotate-180',
              )}
            />
          </>
        )}
      </button>
      {open && !collapsed && (
        <ul className="ml-5 mt-0.5 space-y-0.5 border-l border-border/60 pl-3">
          {(section.items ?? []).map((item) => {
            const itemActive = isSubNavActive(pathname, currentParams, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={itemActive ? 'page' : undefined}
                  className={cn(
                    'block truncate rounded-lg px-3 py-1.5 text-sm transition-colors',
                    itemActive
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}

/**
 * Liste des sections + sous-navigations de la barre latérale. Partagée entre
 * la sidebar desktop (AppSidebar) et le tiroir mobile (BottomNav → Sheet) pour
 * garantir une seule source de vérité de la navigation.
 *
 * La section active (d'après le pathname et le filtre `?type=` d'Actualité)
 * est auto-dépliée ; les toggles manuels priment jusqu'à la navigation
 * suivante, où ils sont réinitialisés.
 */
export function SidebarSections({
  collapsed = false,
  onExpandRequest,
  onNavigate,
}: SidebarSectionsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentParams = searchParams ?? null;
  const { data: user } = useUser();

  const sections = buildNavSections(user);

  // Overrides d'ouverture manuels ; remis à zéro à chaque navigation pour que
  // la section active reprenne l'auto-dépliage.
  const [openOverrides, setOpenOverrides] = React.useState<
    Record<string, boolean>
  >({});
  React.useEffect(() => {
    setOpenOverrides({});
  }, [pathname]);

  return (
    <ul className="space-y-1">
      {sections.map((section) => {
        const active = isSectionActive(pathname, currentParams, section);
        const open = openOverrides[section.label] ?? active;
        return (
          <SectionEntry
            key={section.label}
            section={section}
            pathname={pathname}
            currentParams={currentParams}
            collapsed={collapsed}
            open={open}
            onToggle={() =>
              setOpenOverrides((prev) => ({
                ...prev,
                // En mode replié on force l'ouverture (le dépliage suit).
                [section.label]: collapsed ? true : !open,
              }))
            }
            onExpandRequest={onExpandRequest}
            onNavigate={onNavigate}
          />
        );
      })}
    </ul>
  );
}
