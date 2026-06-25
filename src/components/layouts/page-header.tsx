import { BackButton } from '@/components/ui/back-button';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
  /**
   * Affiche un bouton de retour au-dessus du titre. Activé dès que `showBack`
   * est vrai OU qu'un `backHref` est fourni. Par défaut : aucun bouton (les
   * usages existants restent inchangés).
   */
  showBack?: boolean;
  /** Destination explicite du retour. Si absent, revient à la page précédente. */
  backHref?: string;
  /** Libellé du bouton retour. */
  backLabel?: string;
}

export function PageHeader({
  title,
  subtitle,
  className,
  action,
  showBack,
  backHref,
  backLabel,
}: PageHeaderProps) {
  const withBack = showBack || backHref !== undefined;

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b border-border bg-background-surface/90 px-4 py-3.5 backdrop-blur-md',
        className,
      )}
    >
      {withBack && (
        // pr-12 sur mobile : aligne le retour à l'écart de la cloche flottante.
        <div className="mb-1.5 pr-12 md:pr-0">
          <BackButton href={backHref} label={backLabel} />
        </div>
      )}
      {/* pr-12 sur mobile : laisse la place à la cloche de notification flottante */}
      <div className="flex items-center justify-between gap-3 pr-12 md:pr-0">
        <div className="min-w-0">
          <h1 className="truncate font-serif text-xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
