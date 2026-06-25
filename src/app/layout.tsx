import { Analytics } from '@vercel/analytics/react';
import { Inter, Fraunces } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppProvider } from '@/app/provider';

import '@/styles/globals.css';

// Revue Sacrée — corps de texte lisible (Inter) + titres serif éditoriaux (Fraunces).
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Fraunces est une police variable : on n'épingle pas `weight` (toutes les graisses
// restent disponibles via les classes Tailwind font-light…font-black) + italique.
const fraunces = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-fraunces',
});

export const metadata = {
  title: 'Jàngu Bi',
  description: 'Plateforme communautaire catholique du Sénégal',
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${inter.variable} ${fraunces.variable}`}
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <AppProvider>{children}</AppProvider>
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;

// We are not prerendering anything because the app is highly dynamic
// and the data depends on the user so we need to send cookies with each request
export const dynamic = 'force-dynamic';
