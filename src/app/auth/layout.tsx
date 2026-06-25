import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorState } from '@/components/ui/error-state';
import { Spinner } from '@/components/ui/spinner';

import { AuthLayout as AuthLayoutComponent } from './_components/auth-layout';

export const metadata = {
  title: 'Jàngu Bi',
  description: 'Plateforme communautaire catholique',
};

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center">
          <Spinner size="xl" />
        </div>
      }
    >
      <ErrorBoundary
        fallback={
          <div className="flex min-h-screen items-center justify-center p-6">
            <ErrorState className="max-w-md border-none bg-transparent" />
          </div>
        }
      >
        <AuthLayoutComponent>{children}</AuthLayoutComponent>
      </ErrorBoundary>
    </Suspense>
  );
};

export default AuthLayout;
