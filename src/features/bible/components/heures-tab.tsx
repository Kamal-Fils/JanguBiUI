'use client';

import { Clock, Sun, Sunset, Moon, Star, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  useLiturgyToday,
  LiturgyOffice,
} from '@/features/bible/api/get-liturgy-today';

import { ReadingView } from './reading-view';

function getOfficeConfig(name: string) {
  const lower = (name || '').toLowerCase();
  if (lower.includes('laude'))
    return { icon: Sun, time: 'Matin', color: 'bg-accent/10 text-accent' };
  if (lower.includes('vêpre') || lower.includes('vepre'))
    return { icon: Sunset, time: 'Soir', color: 'bg-warning/10 text-warning' };
  if (lower.includes('complie'))
    return { icon: Moon, time: 'Nuit', color: 'bg-primary/10 text-primary' };
  if (
    lower.includes('milieu') ||
    lower.includes('sexte') ||
    lower.includes('tierce') ||
    lower.includes('none')
  )
    return { icon: Clock, time: 'Jour', color: 'bg-info/10 text-info' };
  return {
    icon: Clock,
    time: 'Jour',
    color: 'bg-secondary text-secondary-foreground',
  };
}

function getCurrentOfficeName(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 8) return 'Laudes';
  if (hour >= 9 && hour <= 11) return 'Tierce';
  if (hour >= 12 && hour <= 13) return 'Sexte';
  if (hour >= 14 && hour <= 16) return 'None';
  if (hour >= 17 && hour <= 20) return 'Vêpres';
  if (hour >= 21 || hour < 5) return 'Complies';
  return 'Laudes';
}

export function HeuresTab() {
  const { data, isLoading } = useLiturgyToday();
  const [selectedOffice, setSelectedOffice] = useState<LiturgyOffice | null>(
    null,
  );

  const currentOfficeRecommended = getCurrentOfficeName();

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const offices = data?.offices || [];

  if (selectedOffice) {
    const htmlSections: string[] = [];
    type OfficeSection = { texte?: string };
    type OfficeMeta = {
      introduction?: string;
      hymne?: OfficeSection;
      psaume_1?: OfficeSection;
      psaume_2?: OfficeSection;
      psaume_3?: OfficeSection;
      cantique?: OfficeSection;
      cantique_zacharie?: OfficeSection;
      cantique_mariale?: OfficeSection;
      cantique_symeon?: OfficeSection;
      capitule?: OfficeSection;
      pericope?: OfficeSection;
      repons?: string;
      intercession?: string;
      notre_pere?: string;
      oraison?: string;
      benediction?: string;
    };
    const meta = (selectedOffice.raw_metadata || {}) as OfficeMeta;

    if (meta.introduction) htmlSections.push(`<div>${meta.introduction}</div>`);
    if (meta.hymne?.texte)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Hymne</h3>${meta.hymne.texte}</div>`,
      );
    if (meta.psaume_1?.texte)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Psaume 1</h3>${meta.psaume_1.texte}</div>`,
      );
    if (meta.psaume_2?.texte)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Psaume 2</h3>${meta.psaume_2.texte}</div>`,
      );
    if (meta.psaume_3?.texte)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Psaume 3</h3>${meta.psaume_3.texte}</div>`,
      );

    // Cantiques depending on office
    if (meta.cantique_zacharie?.texte)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Cantique de Zacharie</h3>${meta.cantique_zacharie.texte}</div>`,
      );
    if (meta.cantique_mariale?.texte)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Cantique de Marie</h3>${meta.cantique_mariale.texte}</div>`,
      );
    if (meta.cantique_symeon?.texte)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Cantique de Syméon</h3>${meta.cantique_symeon.texte}</div>`,
      );

    if (meta.pericope?.texte)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Parole de Dieu</h3><p>${meta.pericope.texte}</p></div>`,
      );
    if (meta.repons)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Répons</h3>${meta.repons}</div>`,
      );

    if (selectedOffice.intercessions || meta.intercession) {
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Intercessions</h3>${selectedOffice.intercessions || meta.intercession}</div>`,
      );
    }
    if (meta.notre_pere)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Notre Père</h3><p>${meta.notre_pere}</p></div>`,
      );
    if (meta.oraison)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Oraison</h3>${meta.oraison}</div>`,
      );
    if (meta.benediction)
      htmlSections.push(
        `<div><h3 class="font-semibold mb-2 text-primary">Bénédiction</h3>${meta.benediction}</div>`,
      );

    // Fallback if raw_metadata is empty
    if (htmlSections.length === 0) {
      if (
        typeof selectedOffice.hymn === 'string' &&
        !selectedOffice.hymn.startsWith('{')
      ) {
        htmlSections.push(selectedOffice.hymn);
      }
      if (selectedOffice.intercessions) {
        htmlSections.push(selectedOffice.intercessions);
      }
    }

    const fullHtml =
      htmlSections.join('<hr class="my-6 border-muted" />') ||
      "<p>Contenu de l'office non disponible.</p>";

    return (
      <ReadingView
        title={selectedOffice.office_type || 'Office'}
        reference=""
        text={fullHtml}
        isHtml={true}
        onBack={() => setSelectedOffice(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Star className="size-4 text-accent" />
        <p className="text-sm text-muted-foreground">
          Office recommandé en ce moment :{' '}
          <span className="font-medium text-gold-ink">
            {currentOfficeRecommended}
          </span>
        </p>
      </div>

      {offices.length === 0 && (
        <div className="text-sm text-muted-foreground italic py-4">
          Aucun office disponible pour aujourd&apos;hui.
        </div>
      )}

      {offices.map((office) => {
        const config = getOfficeConfig(office.office_type || '');
        const Icon = config.icon;
        const isCurrent = (office.office_type || '')
          .toLowerCase()
          .includes(currentOfficeRecommended.toLowerCase().substring(0, 4));

        return (
          <Card
            key={office.id}
            onClick={() => setSelectedOffice(office)}
            className={`hover:bg-background-subtle cursor-pointer gap-0 py-0 transition-colors ${
              isCurrent ? 'border-accent/50 ring-1 ring-accent/20' : ''
            }`}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex size-10 items-center justify-center rounded-lg ${
                  isCurrent ? 'bg-accent text-accent-foreground' : config.color
                }`}
              >
                <Icon className="size-5" />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {office.office_type}
                  </span>
                  {isCurrent && (
                    <Badge
                      variant="secondary"
                      className="bg-accent/10 text-xs text-gold-ink"
                    >
                      En cours
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {config.time}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
