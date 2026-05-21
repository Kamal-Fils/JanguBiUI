import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

import { AuthLayout } from '../_components/auth-layout';

const ForgotPasswordPage = () => (
  <AuthLayout>
    <ForgotPasswordForm />
  </AuthLayout>
);

export default ForgotPasswordPage;
