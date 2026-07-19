'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { paths } from '@/config/paths';
import { RegisterForm } from '@/features/auth/components/register-form';
import { safeRedirect } from '@/utils/safe-redirect';

const RegisterPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  return (
    <RegisterForm
      onSuccess={() =>
        // `redirectTo` vient de l'URL : assaini avant navigation (cf. login).
        router.replace(safeRedirect(redirectTo, paths.app.root.getHref()))
      }
    />
  );
};

export default RegisterPage;
