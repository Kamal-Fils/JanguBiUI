'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { paths } from '@/config/paths';
import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';
import { useUser } from '@/lib/auth';
import {
  isAdmin,
  isClergy,
  isEvequeOrAbove,
  isFidele,
} from '@/lib/authorization';

import { EvequeeDashboard } from './eveque-dashboard';
import { FideleDashboard } from './fidele-dashboard';
import { HomeContent } from './home-content';
import { PretreeDashboard } from './pretre-dashboard';

export function HomeRouter() {
  const { data: user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && isAdmin(user) && !isClergy(user) && pathname === '/app') {
      router.replace(paths.app.admin.root.getHref());
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) return null;

  if (isAdmin(user) && !isClergy(user)) return null;

  // `isFidele` lit la dimension admin (`role==='fidele'`) → vrai aussi pour le
  // clergé, dont `role` reste 'fidele' (l'identité clergé vit dans pastoral_role).
  // On exclut donc explicitement le clergé pour qu'un prêtre/évêque atteigne son
  // dashboard pastoral au lieu du dashboard fidèle.
  if (isFidele(user) && !isClergy(user)) return <FideleDashboard />;
  // isEvequeOrAbove before isClergy — évêque/archevêque are clergy but need a distinct dashboard
  if (isEvequeOrAbove(user)) return <EvequeeDashboard />;
  if (isClergy(user)) return <PretreeDashboard />;

  return <HomeContent widget={<DailyMysteryCard />} />;
}
