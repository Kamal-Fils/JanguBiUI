'use client';

import { Suspense } from 'react';

import { RevertEmail } from '@/features/auth/components/revert-email';

import { AuthLayout } from '../_components/auth-layout';

const RevertEmailPage = () => (
  <AuthLayout>
    <Suspense>
      <RevertEmail />
    </Suspense>
  </AuthLayout>
);

export default RevertEmailPage;
