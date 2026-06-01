import { AppShell } from '@/components/layouts/app-shell';
import { env } from '@/config/env';
import { AlloPretreContent } from '@/features/allo-pretre/components/allo-pretre-content';

// Allo-Prêtre : le backend Availability a été supprimé. La feature ne dépend
// plus que des handlers MSW et n'est exposée que lorsque le mocking est actif,
// le temps de reconstruire l'API en HackSoft (cf. ticket Lot 2/3).
export default function AlloPretreePage() {
  if (!env.ENABLE_API_MOCKING) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">Allo-Prêtre</h1>
          <p className="mt-2 text-muted-foreground">
            Fonctionnalité en cours de préparation.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AlloPretreContent />
    </AppShell>
  );
}
