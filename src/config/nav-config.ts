import {
  BookOpen,
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

const COMMON_ITEMS: NavItem[] = [
  { label: 'Accueil', href: '/app', icon: Home },
  { label: 'Actus', href: '/app/actus', icon: Newspaper },
  { label: 'Spirituel', href: '/app/spirituel', icon: BookOpen },
  { label: 'Documents', href: '/app/documents', icon: FileText },
  { label: 'Messages', href: '/app/messages', icon: MessageCircle },
  { label: 'Profil', href: '/app/profil', icon: User },
];

const ADMIN_ITEM: NavItem = {
  label: 'Administration',
  href: '/app/admin/articles',
  icon: Settings,
  adminOnly: true,
};

export const buildNavItems = (user: UserType | null | undefined): NavItem[] => {
  const items = [...COMMON_ITEMS];
  if (isAdmin(user)) {
    items.push(ADMIN_ITEM);
  }
  return items;
};

export const buildBottomNavItems = (
  user: UserType | null | undefined,
): NavItem[] => {
  const base: NavItem[] = [
    { label: 'Accueil', href: '/app', icon: Home },
    { label: 'Actus', href: '/app/actus', icon: Newspaper },
    { label: 'Spirituel', href: '/app/spirituel', icon: BookOpen },
    { label: 'Messages', href: '/app/messages', icon: MessageCircle },
    { label: 'Profil', href: '/app/profil', icon: User },
  ];

  if (isAdmin(user) || isClergy(user)) {
    base.splice(4, 0, {
      label: isAdmin(user) ? 'Admin' : 'Clergé',
      href: isAdmin(user) ? '/app/admin/articles' : '/app/spirituel/heures',
      icon: Settings,
    });
  }

  return base.slice(0, 6);
};
