'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import { LoginForm } from '@/features/auth/components/login-form';
import { User } from '@/lib/auth';
import { getRoleHomePath } from '@/lib/get-role-home-path';
import { safeRedirect } from '@/utils/safe-redirect';

const LoginPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  return (
    <LoginForm
      onSuccess={() => {
        // `redirectTo` vient de l'URL : il faut l'assainir avant de naviguer,
        // sinon un lien vers notre propre domaine peut renvoyer le fidèle sur
        // un site tiers juste après une connexion réussie.
        const destination = safeRedirect(
          redirectTo,
          getRoleHomePath(queryClient.getQueryData<User>(['user'])),
        );
        router.replace(destination);
      }}
    />
  );
};

export default LoginPage;
