import NextLink, { LinkProps as NextLinkProps } from 'next/link';
import * as React from 'react';

import { cn } from '@/utils/cn';

export type LinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> &
  NextLinkProps & {
    children: React.ReactNode;
  };

export const Link = ({ className, children, href, ...props }: LinkProps) => {
  return (
    <NextLink
      href={href}
      className={cn('transition-colors', className)}
      {...props}
    >
      {children}
    </NextLink>
  );
};
