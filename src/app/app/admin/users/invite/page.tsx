'use client';

import { useRouter } from 'next/navigation';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { Card, CardContent, CardEyebrow } from '@/components/ui/card/card';
import { paths } from '@/config/paths';
import { InvitationForm } from '@/features/clergy-accounts/components/invitation-form';
import { canManageClergy } from '@/lib/authorization';

export default function InvitePage() {
  const router = useRouter();

  return (
    <AdminPageLayout
      title="Inviter du clergé"
      subtitle="Un email d'invitation sera envoyé. Le lien est valable 48h."
      allow={canManageClergy}
      width="md"
    >
      <Card variant="feature">
        <CardContent className="p-4 sm:p-6">
          <CardEyebrow className="mb-4">Nouvelle invitation</CardEyebrow>
          <InvitationForm
            onSuccess={() =>
              router.push(paths.app.admin.users.invitations.getHref())
            }
          />
        </CardContent>
      </Card>
    </AdminPageLayout>
  );
}
