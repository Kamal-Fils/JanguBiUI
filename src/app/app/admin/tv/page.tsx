'use client';

import { AdminPageLayout } from '@/components/layouts/admin-page-layout';
import { AdminCategoriesSection } from '@/features/tv/components/admin-categories-section';
import { AdminVideosSection } from '@/features/tv/components/admin-videos-section';
import { canManageTV } from '@/lib/authorization';

export default function AdminTvPage() {
  return (
    <AdminPageLayout
      title="JanguBi TV"
      subtitle="Gérer les catégories et les vidéos diffusées"
      allow={canManageTV}
    >
      <div className="space-y-8">
        <AdminCategoriesSection />
        <AdminVideosSection />
      </div>
    </AdminPageLayout>
  );
}
