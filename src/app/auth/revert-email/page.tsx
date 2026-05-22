'use client';

import { Suspense } from 'react';

import { RevertEmail } from '@/features/auth/components/revert-email';

const RevertEmailPage = () => (
  <Suspense>
    <RevertEmail />
  </Suspense>
);

export default RevertEmailPage;
