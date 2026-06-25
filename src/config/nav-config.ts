import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Church,
  FileText,
  Heart,
  Home,
  MessageCircle,
  Newspaper,
  User,
} from 'lucide-react';

import { User as UserType } from '@/lib/auth';
import { isAdmin, isClergy } from '@/lib/authorization';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  clergyOnly?: boolean;
}

const ITEM_ACCUEIL: NavItem = { label: 'Accueil', href: '/app', icon: Home };
const ITEM_ACTUS: NavItem = {
  label: 'Actus',
  href: '/app/actus',
  icon: Newspaper,
};
const ITEM_SPIRITUEL: NavItem = {
  label: 'Spiritualité',
  href: '/app/spirituel',
  icon: BookOpen,
};
const ITEM_DOCUMENTS: NavItem = {
  label: 'Documents',
  href: '/app/documents',
  icon: FileText,
};
const ITEM_AGENDA: NavItem = {
  label: 'Agenda',
  href: '/app/agenda',
  icon: Calendar,
};
const ITEM_TRANSFERT: NavItem = {
  label: 'Transfert',
  href: '/app/transfert',
  icon: ArrowLeftRight,
};
const ITEM_MESSAGES: NavItem = {
  label: 'Messages',
  href: '/app/messages',
  icon: MessageCircle,
};
const ITEM_PROFIL: NavItem = { label: 'Profil', href: '/app/profil', icon: User };
const ITEM_DONS: NavItem = {
  label: 'Dons',
  href: '/app/dons',
  icon: Heart,
};
const ITEM_CLERGE: NavItem = {
  label: 'Clergé',
  href: '/app/clerge',
  icon: Church,
  clergyOnly: true,
};
// Admin "home" points directly to /app/admin to avoid the /app → /app/admin redirect flash
const ITEM_ACCUEIL_ADMIN: NavItem = {
  label: 'Accueil',
  href: '/app/admin',
  icon: Home,
  adminOnly: true,
};

export const buildNavItems = (user: UserType | null | undefined): NavItem[] => {
  // Admin roles and clergy roles are disjoint — the !isClergy guard is defensive
  if (isAdmin(user) && !isClergy(user)) {
    return [ITEM_ACCUEIL_ADMIN, ITEM_ACTUS, ITEM_SPIRITUEL, ITEM_MESSAGES, ITEM_PROFIL];
  }

  if (isClergy(user)) {
    return [ITEM_ACCUEIL, ITEM_ACTUS, ITEM_SPIRITUEL, ITEM_CLERGE, ITEM_MESSAGES, ITEM_PROFIL];
  }

  // Fidèle
  return [
    ITEM_ACCUEIL,
    ITEM_ACTUS,
    ITEM_SPIRITUEL,
    ITEM_DOCUMENTS,
    ITEM_DONS,
    ITEM_AGENDA,
    ITEM_TRANSFERT,
    ITEM_MESSAGES,
    ITEM_PROFIL,
  ];
};

/**
 * Logique d'activation d'un lien de nav (partagée par la sidebar et la
 * bottom-nav). Accueil/Admin = exact, le reste = préfixe.
 */
export const isNavActive = (pathname: string, href: string): boolean => {
  if (href === '/app' || href === '/app/admin') return pathname === href;
  return pathname.startsWith(href);
};

/**
 * Bottom-nav mobile : ≤ 4 onglets primaires par rôle. Le 5e emplacement visible
 * est le bouton « Plus » rendu par `BottomNav` à partir de
 * `buildOverflowNavItems` (tous les items sidebar absents de la bottom-nav).
 * On garde donc ici un set resserré et role-aware.
 */
export const buildBottomNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  // Admin pur — Accueil, Actus, Messages, Profil (+ « Plus »)
  if (isAdmin(user) && !isClergy(user)) {
    return [ITEM_ACCUEIL_ADMIN, ITEM_ACTUS, ITEM_MESSAGES, ITEM_PROFIL];
  }

  // Clergé — Accueil, Spiritualité, Actus, Clergé (+ « Plus »)
  if (isClergy(user)) {
    return [ITEM_ACCUEIL, ITEM_SPIRITUEL, ITEM_ACTUS, ITEM_CLERGE];
  }

  // Fidèle — Accueil, Spiritualité, Actus, Messages (+ « Plus »)
  return [ITEM_ACCUEIL, ITEM_SPIRITUEL, ITEM_ACTUS, ITEM_MESSAGES];
};

/**
 * Items présents dans la sidebar mais PAS dans la bottom-nav → exposés via une
 * entrée « Plus » sur mobile pour éviter les routes orphelines.
 * Fidèle : Documents, Dons, Agenda, Transfert, Profil.
 * Clergé : Messages, Profil (+ ses items spécifiques).
 * Admin  : Spiritualité (+ tout item sidebar hors bottom-nav).
 */
export const buildOverflowNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  const bottomHrefs = new Set(buildBottomNavItems(user).map((i) => i.href));
  return buildNavItems(user).filter((i) => !bottomHrefs.has(i.href));
};
