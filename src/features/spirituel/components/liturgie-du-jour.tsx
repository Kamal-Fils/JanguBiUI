'use client';

import { BookOpen } from 'lucide-react';
import * as React from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FontSizeStepper } from '@/components/ui/font-size-stepper';
import { paths } from '@/config/paths';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';

import { useLiturgicalInfo, useMassReadings } from '../api/get-liturgy';
import { useOffice } from '../api/get-office';
import { displayableReadings } from '../utils/mass-readings';

import { LiturgicalHeader } from './liturgical-header';
import { LiturgieSkeleton } from './liturgie-skeleton';
import { OfficeComplement } from './office-complement';
import { ReadingArticle } from './reading-article';
import { ReadingsSummary } from './readings-summary';

/** Confort de lecture par défaut — au-dessus du 16px habituel (cible âgée, R3). */
const DEFAULT_FONT_SIZE = 18;

/**
 * Liturgie du jour — écran de référence de l'archétype **Lecture**.
 *
 * Le fidèle arrive ici depuis l'ouverture de l'accueil (« Lire l'Évangile ») :
 * la page prolonge donc son vocabulaire — marqueur liturgique discret, bleu
 * dominant, échelle réelle — au lieu de retomber sur une pile de cartes
 * uniformes. Le texte est le sujet : mesure ~68ch, interligne généreux, taille
 * réglable, et l'Évangile porte le jour sans que l'ordre liturgique bouge.
 */
export function LiturgieDuJour() {
  // Laudes/Vêpres sont réservées au clergé et aux religieux côté backend
  // (CanAccessLiturgyOfHours) : ne pas les requêter pour un fidèle, sinon
  // l'intercepteur api-client affiche un toast 403 à chaque visite.
  const { data: user } = useUser();
  const canAccessHours = isClergy(user);

  const [fontSize, setFontSize] = React.useState(DEFAULT_FONT_SIZE);

  const infoQuery = useLiturgicalInfo();
  const readingsQuery = useMassReadings();
  const laudesQuery = useOffice('laudes', { enabled: canAccessHours });
  const vepresQuery = useOffice('vepres', { enabled: canAccessHours });

  useRegisterPageMeta({
    title: 'Liturgie du jour',
    showHeading: false,
    backHref: paths.app.spirituel.getHref(),
  });

  // `isLoading` (et non `isPending`) : une requête désactivée reste « pending »
  // indéfiniment côté react-query — un fidèle n'aurait jamais vu la page.
  const isLoading = infoQuery.isLoading || readingsQuery.isLoading;
  const readings = displayableReadings(readingsQuery.data);

  const retry = () => {
    void infoQuery.refetch();
    void readingsQuery.refetch();
  };

  return (
    <ContentContainer width="reading" className="pb-20">
      {isLoading ? (
        <LiturgieSkeleton />
      ) : (
        <>
          <LiturgicalHeader
            title="Liturgie du jour"
            season={infoQuery.data?.season}
            dayName={infoQuery.data?.day_name}
            date={infoQuery.data?.date}
            tools={
              readings.length > 0 ? (
                <FontSizeStepper
                  value={fontSize}
                  onChange={setFontSize}
                  min={16}
                  max={26}
                />
              ) : null
            }
          />

          {readingsQuery.isError ? (
            <ErrorState
              title="Les lectures n’ont pas pu être chargées"
              description="La liaison avec l’AELF n’a pas répondu. Vous pouvez réessayer maintenant."
              onRetry={retry}
            />
          ) : readings.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title="Pas encore de lectures pour aujourd’hui"
              description="Les textes du jour sont synchronisés chaque nuit depuis l’AELF. Revenez dans un moment."
            />
          ) : (
            <>
              <ReadingsSummary readings={readings} />

              <div className="flex flex-col gap-14">
                {readings.map((reading) => (
                  <ReadingArticle
                    key={reading.id}
                    reading={reading}
                    fontSize={fontSize}
                  />
                ))}
              </div>
            </>
          )}

          {canAccessHours && (
            <OfficeComplement
              fontSize={fontSize}
              entries={[
                {
                  office: laudesQuery.data,
                  label: 'Laudes',
                  hint: 'Prière du matin',
                },
                {
                  office: vepresQuery.data,
                  label: 'Vêpres',
                  hint: 'Prière du soir',
                },
              ]}
            />
          )}
        </>
      )}
    </ContentContainer>
  );
}
