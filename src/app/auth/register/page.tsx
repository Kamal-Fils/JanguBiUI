'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { paths } from '@/config/paths';
import { RegisterForm } from '@/features/auth/components/register-form';

const RegisterPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  return (
    <RegisterForm
      onSuccess={() =>
        router.replace(
          `${redirectTo ? `${decodeURIComponent(redirectTo)}` : paths.app.root.getHref()}`,
        )
      }
    />
  );
};

export default RegisterPage;
