import { redirect } from 'next/navigation';

import { paths } from '@/config/paths';

export default function AdminRootPage() {
  redirect(paths.app.admin.articles.getHref());
}
