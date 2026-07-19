'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { paths } from '@/config/paths';
import { DailyMysteryCard } from '@/features/chapelet/components/daily-mystery-card';
import { HomeContent } from '@/features/home/home-content';
import { useUser } from '@/lib/auth';
import {
  isAdmin,
  isArcheveque,
  isClergy,
  isEvequeOrAbove,
  isFidele,
} from '@/lib/authorization';

import { ArchevequeDashboard } from './archeveque-dashboard';
import { EvequeeDashboard } from './eveque-dashboard';
import { FideleDashboard } from './fidele-dashboard';
import { PretreeDashboard } from './pretre-dashboard';

/**
 * Aiguillage de l'accueil selon le rôle.
 *
 * Il vit dans la **couche app** et non dans `features/home` : un tableau de
 * bord de clergé agrège intentions, messagerie, actualités et statistiques
 * — quatre features distinctes. Composer cet assemblage depuis une feature
 * imposait des imports croisés (`features/home` → `features/intentions`,
 * `features/messaging`, `features/news`, `features/reflexion-pastorale`), ce
 * que l'architecture interdit. L'assemblage inter-features est précisément le
 * métier de la couche app, qui a le droit d'importer n'importe quelle feature.
 */
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
  // Archevêque AVANT évêque : vue PROVINCE dédiée (il voyait le dashboard
  // évêque, scopé sur un seul diocèse — retour d'audit Lot 4).
  if (isArcheveque(user)) return <ArchevequeDashboard />;
  // isEvequeOrAbove before isClergy — évêque/archevêque are clergy but need a distinct dashboard
  if (isEvequeOrAbove(user)) return <EvequeeDashboard />;
  if (isClergy(user)) return <PretreeDashboard />;

  return <HomeContent widget={<DailyMysteryCard />} />;
}
