import { Skeleton } from '@/components/ui/skeleton';

/**
 * Squelette **à la forme de la page** : surtitre court, titre display, filet,
 * sommaire, puis blocs de lecture. Un squelette générique ferait sauter la mise
 * en page à l'arrivée des données.
 */
export function LiturgieSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="mb-10">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="mt-4 h-12 w-4/5" />
        <Skeleton className="mt-4 h-5 w-2/3" />
        <Skeleton className="mt-6 h-px w-full" />
      </div>

      <div className="mb-12 flex flex-col gap-4">
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} className="h-5 w-full" />
        ))}
      </div>

      <div className="flex flex-col gap-10">
        {[0, 1].map((block) => (
          <div key={block}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-3 h-7 w-3/5" />
            <div className="mt-5 flex flex-col gap-2.5">
              {[0, 1, 2, 3, 4].map((line) => (
                <Skeleton key={line} className="h-4 w-full last:w-2/3" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
