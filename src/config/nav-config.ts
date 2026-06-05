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
  ShieldCheck,
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
  label: 'Spirituel',
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
const ITEM_PROFIL: NavItem = {
  label: 'Profil',
  href: '/app/profil',
  icon: User,
};
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
// Passerelle vers les outils admin pour un membre du clergé qui est AUSSI
// administrateur digital (ex. curé = pretre + parish_admin). Sa home reste
// pastorale (cf. home-router) ; cette entrée lui donne accès à l'admin sans
// quitter sa nav clergé. Libellé distinct de l'« Accueil » admin.
const ITEM_ADMIN: NavItem = {
  label: 'Administration',
  href: '/app/admin',
  icon: ShieldCheck,
  adminOnly: true,
};

export const buildNavItems = (user: UserType | null | undefined): NavItem[] => {
  // Les deux dimensions (role admin / pastoral_role) sont INDÉPENDANTES : un curé
  // peut être à la fois parish_admin et pretre. Le guard `!isClergy` est donc
  // porteur (pas « défensif ») — il aiguille un tel utilisateur vers la nav
  // clergé (home pastorale), tandis qu'il accède à l'admin via ITEM_ADMIN.
  if (isAdmin(user) && !isClergy(user)) {
    return [
      ITEM_ACCUEIL_ADMIN,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  if (isClergy(user)) {
    return [
      ITEM_ACCUEIL,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_CLERGE,
      // Clergé qui est aussi admin digital → passerelle vers l'admin.
      ...(isAdmin(user) ? [ITEM_ADMIN] : []),
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
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

export const buildBottomNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  if (isAdmin(user) && !isClergy(user)) {
    return [
      ITEM_ACCUEIL_ADMIN,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  if (isClergy(user)) {
    return [
      ITEM_ACCUEIL,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_CLERGE,
      ITEM_MESSAGES,
      ITEM_PROFIL,
    ];
  }

  // Fidèle — Spirituel + Documents dans la bottom nav, le reste via « Plus »
  return [
    ITEM_ACCUEIL,
    ITEM_ACTUS,
    ITEM_SPIRITUEL,
    ITEM_DOCUMENTS,
    ITEM_MESSAGES,
    ITEM_PROFIL,
  ];
};

/**
 * Items présents dans la sidebar mais PAS dans la bottom-nav → exposés via une
 * entrée « Plus » sur mobile pour éviter les routes orphelines (fidèle :
 * Dons, Agenda, Transfert).
 */
export const buildOverflowNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  const bottomHrefs = new Set(buildBottomNavItems(user).map((i) => i.href));
  return buildNavItems(user).filter((i) => !bottomHrefs.has(i.href));
};
