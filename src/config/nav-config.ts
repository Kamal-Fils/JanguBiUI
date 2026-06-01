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

  // Fidèle — Spirituel + Documents dans la bottom nav, Agenda/Transfert via sidebar
  return [
    ITEM_ACCUEIL,
    ITEM_ACTUS,
    ITEM_SPIRITUEL,
    ITEM_DOCUMENTS,
    ITEM_MESSAGES,
    ITEM_PROFIL,
  ];
};
