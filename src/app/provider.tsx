'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import * as React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { MainErrorFallback } from '@/components/errors/main';
import { ThemeProvider } from '@/components/layouts/theme-provider';
import { Notifications } from '@/components/ui/notifications';
import { getRefreshToken, tryRefreshAccess } from '@/lib/api-client';
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

  React.useEffect(() => {
    if (getRefreshToken()) {
      tryRefreshAccess()
        .then(() => queryClient.invalidateQueries({ queryKey: ['user'] }))
        .catch(() => {
          // Refresh token expired — user will need to log in again
        });
    }
  }, [queryClient]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
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
