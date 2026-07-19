'use client';

import { Lock } from 'lucide-react';
import * as React from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EmptyState } from '@/components/ui/empty-state';
import { FontSizeStepper } from '@/components/ui/font-size-stepper';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

import { useLiturgicalInfo } from '../../api/get-liturgy';
import type { OfficeKey } from '../../api/get-office';
import { LiturgicalHeader } from '../liturgical-header';
import { LiturgieSkeleton } from '../liturgie-skeleton';

import { OfficeSelector } from './office-selector';
import { OfficeView } from './office-view';

const DEFAULT_FONT_SIZE = 18;

export function getCurrentOfficeKey(now: Date = new Date()): OfficeKey {
  const hour = now.getHours();
  if (hour < 6) return 'lectures';
  if (hour < 9) return 'laudes';
  if (hour < 12) return 'tierce';
  if (hour < 15) return 'sexte';
  if (hour < 18) return 'none';
  if (hour < 21) return 'vepres';
  return 'complies';
}

/**
 * Liturgie des Heures — même archétype **Lecture** que la liturgie du jour :
 * ouverture avec marqueur liturgique discret, mesure de lecture, taille de
 * texte réglable.
 *
 * L'accès est réservé au clergé et aux religieux côté backend
 * (`CanAccessLiturgyOfHours`). On refuse donc **avant** de requêter : sinon un
 * fidèle déclenchait un toast 403 à chaque visite, exactement le défaut déjà
 * corrigé sur la liturgie du jour.
 */
export function LiturgieHeures() {
  const { data: user, isLoading: loadingUser } = useUser();
  const canAccess = isClergy(user);

  const [currentKey] = React.useState(getCurrentOfficeKey);
  const [selectedOffice, setSelectedOffice] =
    React.useState<OfficeKey>(currentKey);
  const [fontSize, setFontSize] = React.useState(DEFAULT_FONT_SIZE);

  const infoQuery = useLiturgicalInfo();

  useRegisterPageMeta({
    title: 'Liturgie des Heures',
    showHeading: false,
    backHref: paths.app.spirituel.getHref(),
  });

  if (loadingUser || infoQuery.isLoading) {
    return (
      <ContentContainer width="reading" className="pb-20">
        <LiturgieSkeleton />
      </ContentContainer>
    );
  }

  return (
    <ContentContainer width="reading" className="pb-20">
      <LiturgicalHeader
        title="Liturgie des Heures"
        season={infoQuery.data?.season}
        dayName={infoQuery.data?.day_name}
        date={infoQuery.data?.date}
        tools={
          canAccess ? (
            <FontSizeStepper
              value={fontSize}
              onChange={setFontSize}
              min={16}
              max={26}
            />
          ) : null
        }
      />

      {canAccess ? (
        <>
          <OfficeSelector
            selected={selectedOffice}
            onChange={setSelectedOffice}
            currentKey={currentKey}
          />
          <div className="mt-10">
            <OfficeView officeKey={selectedOffice} fontSize={fontSize} />
          </div>
        </>
      ) : (
        <EmptyState
          icon={<Lock />}
          title="Office réservé au clergé et aux religieux"
          description="La Liturgie des Heures accompagne celles et ceux qui en ont la charge. Les lectures de la messe du jour, elles, sont ouvertes à tous."
        />
      )}
    </ContentContainer>
  );
}
