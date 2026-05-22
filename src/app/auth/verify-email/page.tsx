'use client';

import { Suspense } from 'react';

import { VerifyEmail } from '@/features/auth/components/verify-email';

const VerifyEmailPage = () => (
  <Suspense>
    <VerifyEmail />
  </Suspense>
);

export default VerifyEmailPage;
