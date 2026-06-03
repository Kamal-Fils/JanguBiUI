import NextLink, { LinkProps as NextLinkProps } from 'next/link';

import { cn } from '@/utils/cn';

export type LinkProps = {
  className?: string;
  children: React.ReactNode;
  target?: string;
} & NextLinkProps;

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
