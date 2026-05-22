import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  Church,
  FileText,
  Home,
  MessageCircle,
  Newspaper,
  Settings,
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
const ITEM_CLERGE: NavItem = {
  label: 'Clergé',
  href: '/app/clerge',
  icon: Church,
  clergyOnly: true,
};
const ITEM_ADMIN: NavItem = {
  label: 'Administration',
  href: '/app/admin',
  icon: Settings,
  adminOnly: true,
};

export const buildNavItems = (user: UserType | null | undefined): NavItem[] => {
  if (isAdmin(user) && !isClergy(user)) {
    return [ITEM_ACCUEIL, ITEM_ACTUS, ITEM_SPIRITUEL, ITEM_ADMIN, ITEM_MESSAGES, ITEM_PROFIL];
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
      ITEM_ACCUEIL,
      ITEM_ACTUS,
      ITEM_SPIRITUEL,
      ITEM_ADMIN,
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

  // Fidèle — Documents + Agenda dans la bottom nav, Transfert accessible via sidebar/accueil
  return [
    ITEM_ACCUEIL,
    ITEM_ACTUS,
    ITEM_DOCUMENTS,
    ITEM_AGENDA,
    ITEM_MESSAGES,
    ITEM_PROFIL,
  ];
};
