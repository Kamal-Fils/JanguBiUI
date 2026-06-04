import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/layouts/app-shell';

export const metadata: Metadata = {
  title: 'Jàngu Bi — Bible, Chapelet & Spiritualité',
  description:
    'Votre compagnon spirituel quotidien. Lectures du jour, chapelet guidé et mise en relation avec des prêtres.',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F6F8FB' },
    { media: '(prefers-color-scheme: dark)', color: '#0B1220' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const dynamic = 'force-dynamic';

// Le shell applicatif (sidebar desktop + bottom-nav mobile + garde d'onboarding)
// est monté ICI, une seule fois, pour TOUTES les routes /app/*. Les pages ne
// doivent plus envelopper leur contenu dans <AppShell> (sinon double shell).
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
