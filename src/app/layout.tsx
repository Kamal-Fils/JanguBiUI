import { Playfair_Display } from 'next/font/google';
import { ReactNode } from 'react';

import { AppProvider } from '@/app/provider';

import '@/styles/globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
});

export const metadata = {
  title: 'Jàngu Bi',
  description: 'Plateforme communautaire catholique du Sénégal',
};

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="fr" suppressHydrationWarning className={playfair.variable}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
};

export default RootLayout;

// We are not prerendering anything because the app is highly dynamic
// and the data depends on the user so we need to send cookies with each request
export const dynamic = 'force-dynamic';
