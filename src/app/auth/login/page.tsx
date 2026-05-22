'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';

import { LoginForm } from '@/features/auth/components/login-form';
import { User } from '@/lib/auth';
import { getRoleHomePath } from '@/lib/get-role-home-path';

const LoginPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');

  return (
    <LoginForm
      onSuccess={() => {
        const destination = redirectTo
          ? decodeURIComponent(redirectTo)
          : getRoleHomePath(queryClient.getQueryData<User>(['user']));
        router.replace(destination);
      }}
    />
  );
};

export default LoginPage;
