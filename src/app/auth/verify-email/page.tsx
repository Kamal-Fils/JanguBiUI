'use client';

import { Suspense } from 'react';

import { VerifyEmail } from '@/features/auth/components/verify-email';

import { AuthLayout } from '../_components/auth-layout';

const VerifyEmailPage = () => (
  <AuthLayout>
    <Suspense>
      <VerifyEmail />
    </Suspense>
  </AuthLayout>
);

export default VerifyEmailPage;
