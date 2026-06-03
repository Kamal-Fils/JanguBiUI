import { Analytics } from '@vercel/analytics/react';
import { Inter, Playfair_Display } from 'next/font/google';
import type { ReactNode } from 'react';

import { AppProvider } from '@/app/provider';

import '@/styles/globals.css';

// Sacred Editorial — corps de texte lisible (Inter) + titres serif (Playfair).
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
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
      className={`${inter.variable} ${playfair.variable}`}
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
