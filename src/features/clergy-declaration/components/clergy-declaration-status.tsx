'use client';

import { CheckCircle2, Clock, FileText, XCircle } from 'lucide-react';

import { Card, CardEyebrow } from '@/components/ui/card/card';
import { StatusBadge, type StatusConfig } from '@/components/ui/status-badge';
import { ROLE_LABELS } from '@/config/roles';

import type { ClergyDeclaration } from '../api/get-my-clergy-declaration';

const STATUS_CONFIG: Record<ClergyDeclaration['status'], StatusConfig> = {
  pending: {
    label: 'En attente de validation',
    tone: 'progress',
    icon: <Clock />,
  },
  approved: { label: 'Validée', tone: 'success', icon: <CheckCircle2 /> },
  rejected: { label: 'Refusée', tone: 'danger', icon: <XCircle /> },
};

const STATUS_EXPLANATION: Record<ClergyDeclaration['status'], string> = {
  pending:
    "Votre autorité hiérarchique a été notifiée. Tant qu'elle n'a pas statué, votre compte reste un compte fidèle : les fonctionnalités réservées au clergé ne sont pas encore ouvertes.",
  approved:
    'Votre rôle pastoral est reconnu. Les fonctionnalités réservées au clergé sont désormais accessibles depuis votre menu.',
  rejected:
    'Votre demande n’a pas été retenue. Vous pouvez corriger les points signalés puis déposer une nouvelle demande.',
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface ClergyDeclarationStatusProps {
  declaration: ClergyDeclaration;
}

export function ClergyDeclarationStatus({
  declaration,
}: ClergyDeclarationStatusProps) {
  const status = STATUS_CONFIG[declaration.status];
  const submittedOn = formatDate(declaration.submitted_at);
  const reviewedOn = formatDate(declaration.reviewed_at);

  return (
    <Card variant="sacred" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <CardEyebrow className="text-xs text-secondary-foreground dark:text-primary">
            Ma demande
          </CardEyebrow>
          {/* R2 — le sujet de l'écran se lit sans lire : le rôle revendiqué. */}
          <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground">
            {ROLE_LABELS[declaration.claimed_pastoral_role]}
          </h2>
          {declaration.parish_name && (
            <p className="mt-1 text-sm text-muted-foreground">
              {declaration.parish_name}
            </p>
          )}
        </div>
        <StatusBadge {...status} />
      </div>

      <p className="mt-4 text-sm text-foreground">
        {STATUS_EXPLANATION[declaration.status]}
      </p>

      {/* Le motif du refus est la seule information qui rend le refus
          actionnable : sans lui, le demandeur ne peut pas corriger. */}
      {declaration.status === 'rejected' && declaration.rejection_reason && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
            Motif du refus
          </p>
          <p className="mt-1 text-sm text-foreground">
            {declaration.rejection_reason}
          </p>
        </div>
      )}

      <dl className="mt-5 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        {submittedOn && (
          <div>
            <dt className="text-xs text-muted-foreground">Déposée le</dt>
            <dd className="text-foreground">{submittedOn}</dd>
          </div>
        )}
        {reviewedOn && (
          <div>
            <dt className="text-xs text-muted-foreground">Décision rendue le</dt>
            <dd className="text-foreground">{reviewedOn}</dd>
          </div>
        )}
        {declaration.justification_file_url && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Justificatif</dt>
            <dd>
              <a
                href={declaration.justification_file_url}
                target="_blank"
                rel="noreferrer"
                // R3 — cible tactile ≥ 44 px, pas de survol comme seule affordance.
                className="inline-flex min-h-11 items-center gap-2 text-primary underline underline-offset-4"
              >
                <FileText className="size-4" aria-hidden="true" />
                Consulter la pièce transmise
              </a>
            </dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
