'use client';

import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button/button';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useAcceptInvitation } from '@/features/clergy-accounts/api/accept-invitation';
import { useInvitationByToken } from '@/features/clergy-accounts/api/validate-token';
import { useUser } from '@/lib/auth';

const ROLE_LABELS: Record<string, string> = {
  pretre: 'Prêtre',
  diacre: 'Diacre',
  religieux: 'Religieux/Religieuse',
  eveque: 'Évêque',
  archeveque: 'Archevêque',
};

interface AcceptInvitationContentProps {
  token: string;
}

export function AcceptInvitationContent({
  token,
}: AcceptInvitationContentProps) {
  const router = useRouter();
  const { data: user } = useUser();
  const { data: invitation, isLoading, isError } = useInvitationByToken(token);

  const accept = useAcceptInvitation({
    onSuccess: () => {
      router.push(paths.app.root.getHref());
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-8 text-center shadow-sm">
          <XCircle className="mx-auto mb-4 size-12 text-destructive" />
          <h1 className="text-xl font-bold text-foreground">
            Invitation invalide
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ce lien d&apos;invitation est expiré, révoqué ou introuvable.
          </p>
          <Link href={paths.auth.login.getHref()}>
            <Button className="mt-6 w-full" variant="outline">
              Se connecter
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (accept.isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-4 size-12 text-success" />
          <h1 className="text-xl font-bold text-foreground">
            Invitation acceptée !
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre rôle a été mis à jour. Bienvenue sur Jàngu Bi.
          </p>
          <Link href={paths.app.root.getHref()}>
            <Button className="mt-6 w-full">Accéder à la plateforme</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
          <h1 className="mb-1 text-xl font-bold text-foreground">
            Invitation reçue
          </h1>
          <p className="text-sm text-muted-foreground">
            Vous avez été invité(e) en tant que{' '}
            <strong>{ROLE_LABELS[invitation.pastoral_role]}</strong>.
          </p>
          {invitation.diocese_name && (
            <p className="mt-1 text-xs text-muted-foreground">
              Diocèse : {invitation.diocese_name}
            </p>
          )}
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Connectez-vous ou créez un compte avec l&apos;adresse{' '}
              <strong>{invitation.email}</strong>, puis revenez sur ce lien pour
              activer votre rôle.
            </p>
            <Link
              href={paths.auth.login.getHref(
                paths.acceptInvitation.getHref(token),
              )}
            >
              <Button className="w-full">Se connecter</Button>
            </Link>
            <Link
              href={paths.auth.register.getHref(
                paths.acceptInvitation.getHref(token),
              )}
            >
              <Button variant="outline" className="w-full">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-1 text-xl font-bold text-foreground">
          Accepter l&apos;invitation
        </h1>
        <p className="text-sm text-muted-foreground">
          Vous allez recevoir le rôle{' '}
          <strong>{ROLE_LABELS[invitation.pastoral_role]}</strong>
          {invitation.diocese_name &&
            ` pour le diocèse de ${invitation.diocese_name}`}
          .
        </p>

        {accept.isError && (
          <p className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            Une erreur s&apos;est produite. Vérifiez que votre adresse email
            correspond à l&apos;invitation.
          </p>
        )}

        <Button
          className="mt-6 w-full"
          disabled={accept.isPending}
          onClick={() => accept.mutate(token)}
        >
          {accept.isPending ? <Spinner className="size-4" /> : 'Accepter'}
        </Button>
      </div>
    </div>
  );
}
