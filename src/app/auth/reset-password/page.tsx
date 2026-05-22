'use client';

import { Suspense } from 'react';

import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

const ResetPasswordPage = () => (
  <Suspense>
    <ResetPasswordForm />
  </Suspense>
);

export default ResetPasswordPage;
