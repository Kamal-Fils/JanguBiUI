'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { MainErrorFallback } from '@/components/errors/main';
import { ThemeProvider } from '@/components/layouts/theme-provider';
import { Notifications } from '@/components/ui/notifications';
import { queryConfig } from '@/lib/react-query';

type AppProviderProps = {
  children: React.ReactNode;
};

export const AppProvider = ({ children }: AppProviderProps) => {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: queryConfig,
      }),
  );

  // Le bootstrap de session (refresh au cold load) vit désormais dans
  // src/lib/api-client.ts : il démarre au chargement du bundle et fetchApi
  // attend sa résolution — plus besoin d'un effect ici (qui arrivait APRÈS le
  // premier tir des queries → 401 garanti sur /me/).

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        <QueryClientProvider client={queryClient}>
          {process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
          <Notifications />
          {children}
        </QueryClientProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
};
