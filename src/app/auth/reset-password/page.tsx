'use client';

import { Suspense } from 'react';

import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

import { AuthLayout } from '../_components/auth-layout';

const ResetPasswordPage = () => (
  <AuthLayout>
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  </AuthLayout>
);

export default ResetPasswordPage;
