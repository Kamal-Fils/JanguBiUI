import { ErrorState } from '@/components/ui/error-state';

export const MainErrorFallback = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
      <ErrorState
        title="Une erreur inattendue est survenue"
        description="Quelque chose s'est mal passé. Vous pouvez recharger la page pour réessayer."
        retryLabel="Recharger la page"
        onRetry={() => window.location.assign(window.location.origin)}
        className="max-w-md border-none bg-transparent"
      />
    </div>
  );
};
