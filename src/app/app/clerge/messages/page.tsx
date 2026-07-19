'use client';

import { ArrowLeft, Inbox, SquarePen } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ContentContainer } from '@/components/layouts/content-container';
import { useRegisterPageMeta } from '@/components/layouts/page-meta';
import { Button } from '@/components/ui/button/button';
import { EmptyState } from '@/components/ui/empty-state';
import { RelativeTime } from '@/components/ui/relative-time';
import { UserAvatar } from '@/components/ui/user-avatar';
import { paths } from '@/config/paths';
import type { ClergicalMessage } from '@/features/messaging/api/get-clerical-inbox';
import { ClericalComposeForm } from '@/features/messaging/components/clerical-compose-form';
import { ClericalInboxList } from '@/features/messaging/components/clerical-inbox-list';
import { useUser } from '@/lib/auth';
import { isClergy } from '@/lib/authorization';
import { useParishes } from '@/lib/org/get-parishes';
import { cn } from '@/lib/utils';

/**
 * Vue courante — pilotée par l'URL (`?tab=nouveau`), donc par la **barre
 * latérale**, jamais par des onglets dans la page. C'était le dernier écran à
 * conserver un `role="tablist"` ; le client a tranché contre les onglets au
 * profit d'une navigation à rubriques (cf. Actualité `?type=`, Bible `?tab=`).
 * La valeur est déclarée en miroir dans `src/config/nav-config.ts`.
 */
const COMPOSE_VIEW = 'nouveau';

export default function ClergeMessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useUser();
  const [selectedMessage, setSelectedMessage] =
    useState<ClergicalMessage | null>(null);

  const isComposing = searchParams?.get('tab') === COMPOSE_VIEW;
  const inboxHref = paths.app.clerge.messages.getHref();
  const composeHref = `${inboxHref}?tab=${COMPOSE_VIEW}`;

  // Le fetch des paroisses vit dans la page (couche `app`) : une feature ne peut
  // pas importer une autre feature. La liste est passée en prop au formulaire.
  const { data: parishes = [], isLoading: parishesLoading } = useParishes();

  useEffect(() => {
    if (!isLoading && !isClergy(user)) {
      router.replace(paths.app.root.getHref());
    }
  }, [user, isLoading, router]);

  useRegisterPageMeta({
    title: isComposing
      ? 'Nouveau message inter-clergé'
      : 'Messages inter-clergé',
    subtitle: isComposing
      ? 'Écrire à un confrère, au clergé d’une paroisse ou d’un diocèse'
      : undefined,
    backHref: isComposing ? inboxHref : paths.app.clerge.root.getHref(),
  });

  if (isLoading || !isClergy(user)) return null;

  // ── Rédaction ──────────────────────────────────────────────────────────────
  if (isComposing) {
    return (
      <ContentContainer>
        {/* Colonne de saisie étroite : un formulaire de 4 champs n'a rien à
            gagner à s'étirer sur toute la largeur du cadre. */}
        <div className="max-w-2xl">
          <ClericalComposeForm
            onSuccess={() => router.push(inboxHref)}
            parishes={parishes}
            parishesLoading={parishesLoading}
          />
        </div>
      </ContentContainer>
    );
  }

  // ── Boîte de réception ─────────────────────────────────────────────────────
  return (
    <div className="flex flex-1 flex-col">
      {/* Action principale visible (archétype Travail) : sur mobile la barre
          latérale est un tiroir, écrire ne doit pas coûter deux gestes. */}
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">
          Boîte de réception
        </h2>
        <Button
          size="sm"
          className="h-11 shrink-0 md:h-8"
          icon={<SquarePen className="size-4" aria-hidden="true" />}
          onClick={() => router.push(composeHref)}
        >
          Nouveau message
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden border-t border-border">
        {/* Liste — pleine largeur sur mobile, colonne fixe sur desktop.
            Masquée sur mobile dès qu'un message est ouvert. */}
        <div
          className={cn(
            'w-full overflow-y-auto border-border md:w-80 md:flex-shrink-0 md:border-r',
            selectedMessage ? 'hidden md:block' : 'block',
          )}
        >
          <ClericalInboxList
            onSelect={setSelectedMessage}
            selectedId={selectedMessage?.id}
          />
        </div>

        {/* Détail — pleine largeur sur mobile quand un message est ouvert. */}
        <div
          className={cn(
            'flex-1 overflow-y-auto p-4 md:p-6',
            selectedMessage ? 'block' : 'hidden md:block',
          )}
        >
          {selectedMessage ? (
            <article>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMessage(null)}
                icon={<ArrowLeft className="size-4" aria-hidden="true" />}
                className="mb-4 -ml-2 h-11 gap-1.5 px-2 text-muted-foreground hover:text-foreground md:hidden"
              >
                Retour
              </Button>
              {/* Le sujet est le sujet de l'écran : il porte l'échelle (R2). */}
              <h3 className="font-serif text-xl font-bold leading-tight tracking-tight text-foreground md:text-2xl">
                {selectedMessage.subject}
              </h3>
              <div className="mt-3 flex items-center gap-3">
                <UserAvatar email={selectedMessage.sender_email} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {selectedMessage.sender_email}
                  </p>
                  <RelativeTime
                    iso={selectedMessage.created_at}
                    className="text-xs text-muted-foreground"
                  />
                </div>
              </div>
              {/* Filet bleu : le bleu domine, l'or reste un accent (R4). */}
              <div
                className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-primary/35 to-transparent"
                aria-hidden="true"
              />
              {/* Mesure de lecture : un message se lit, il ne se scanne pas. */}
              <div className="mt-5 max-w-[68ch] whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                {selectedMessage.body}
              </div>
            </article>
          ) : (
            <div className="mt-12">
              <EmptyState
                icon={<Inbox aria-hidden="true" />}
                title="Aucun message sélectionné"
                description="Sélectionnez un message dans la liste pour le lire."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
