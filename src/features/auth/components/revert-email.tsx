'use client';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { paths } from '@/config/paths';

import { useRevertEmailChange } from '../api/revert-email';

export const RevertEmail = () => {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';
  const { mutate, isPending, isSuccess, isError } = useRevertEmailChange();
  const triggered = useRef(false);

  useEffect(() => {
    if (token && !triggered.current) {
      triggered.current = true;
      mutate({ token });
    }
  }, [token, mutate]);

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <XCircle className="size-12 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Lien de rétablissement invalide.
        </p>
        <NextLink
          href={paths.auth.login.getHref()}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Retour à la connexion
        </NextLink>
      </div>
    );
  }

  if (isPending || (!isSuccess && !isError)) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          Rétablissement en cours…
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <XCircle className="size-12 text-destructive" />
        <p className="text-sm font-medium text-foreground">
          Le lien est invalide ou a expiré.
        </p>
        <NextLink
          href={paths.auth.login.getHref()}
          className="text-sm font-medium text-primary hover:text-primary/80"
        >
          Retour à la connexion
        </NextLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <CheckCircle2 className="size-12 text-success" />
      <p className="text-sm font-medium text-foreground">
        Votre ancienne adresse email a été rétablie avec succès.
      </p>
      <NextLink
        href={paths.auth.login.getHref()}
        className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        Se connecter
      </NextLink>
    </div>
  );
};
