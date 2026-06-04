import * as React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/utils/cn';

const sizeMap = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

/** Initiales à partir d'un nom complet ou d'un e-mail. */
export function getInitials(nameOrEmail?: string | null): string {
  if (!nameOrEmail) return '?';
  const base = nameOrEmail.includes('@')
    ? nameOrEmail.split('@')[0]
    : nameOrEmail;
  const parts = base
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserAvatarProps {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
}

/**
 * Avatar utilisateur unifié (image + repli initiales sur fond primary/10).
 * Remplace les 4 duplications de `getInitials` + `<Avatar><AvatarFallback>`.
 */
export function UserAvatar({
  name,
  email,
  src,
  size = 'md',
  className,
}: UserAvatarProps) {
  const label = name || email || '';
  return (
    <Avatar className={cn(sizeMap[size], className)}>
      {src && <AvatarImage src={src} alt={label} />}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {getInitials(label)}
      </AvatarFallback>
    </Avatar>
  );
}
