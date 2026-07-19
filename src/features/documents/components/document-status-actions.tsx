'use client';

import {
  CheckCircle,
  Info,
  MoreHorizontal,
  PenLine,
  Play,
  XCircle,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { useNotifications } from '@/components/ui/notifications';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/utils/cn';

import {
  useDepositDocument,
  useRejectDocument,
  useRequestInfo,
  useStartVerification,
  useValidateDocument,
} from '../api/admin-actions';
import { useUploadDocumentFile } from '../api/upload-document-file';
import { DocumentStatus } from '../types';

/** Le dépôt attend un acte signé, pas une image d'écran. */
const DEPOSIT_ACCEPT = '.pdf,application/pdf';
const DEPOSIT_MAX_BYTES = 10 * 1024 * 1024;

/**
 * Libellés uniques des transitions — repris à l'identique par le bouton
 * d'action principale et par le menu « ⋯ », pour qu'un agent ne découvre
 * jamais deux noms pour le même acte.
 */
const ACTION_LABELS = {
  startVerification: 'Démarrer la vérification',
  requestInfo: 'Demander une information',
  validate: 'Transmettre au curé',
  deposit: 'Signer et déposer',
  reject: 'Rejeter',
} as const;

interface PrimaryAction {
  label: string;
  icon: ReactNode;
  /** `gold` = acte du curé (signature) ; `default` = traitement niveau 1. */
  variant: 'default' | 'gold';
  isPending: boolean;
  run: () => void;
}

/** Statuts terminaux : la demande est sortie de la file, plus rien à faire. */
const CLOSED_STATUSES: DocumentStatus[] = ['rejected', 'document_deposited'];

/**
 * Une demande offre-t-elle encore des actions ? Exporté pour que les listes
 * n'aient pas à réserver d'espace (ni de séparateur) sous une ligne clôturée.
 */
export function hasStatusActions(status: DocumentStatus): boolean {
  return !CLOSED_STATUSES.includes(status);
}

interface DocumentStatusActionsProps {
  requestId: string;
  status: DocumentStatus;
  /** Description humaine de la demande (ex. « Baptême de A. Ndiaye »). */
  subject?: string;
  /**
   * Étire l'action principale sur toute la largeur — utilisé par les lignes
   * mobiles, où viser un bouton compact aligné à droite coûte un essai raté.
   */
  fullWidthPrimary?: boolean;
}

/**
 * Actions de traitement d'une demande.
 *
 * L'**action principale du statut** est un bouton visible (l'acte le plus
 * fréquent ne doit pas coûter deux clics) ; le menu « ⋯ » ne garde que les
 * actions secondaires. Les transitions à motif obligatoire (demande d'info,
 * rejet) conservent leur dialogue — aucune règle métier n'est modifiée.
 */
export function DocumentStatusActions({
  requestId,
  status,
  subject = 'la demande',
  fullWidthPrimary = false,
}: DocumentStatusActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositFile, setDepositFile] = useState<File | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);

  const { addNotification } = useNotifications();
  const uploadFile = useUploadDocumentFile();

  const startVerification = useStartVerification();
  const requestInfo = useRequestInfo();
  const validate = useValidateDocument();
  const reject = useRejectDocument();
  const deposit = useDepositDocument();

  if (!hasStatusActions(status)) return null;

  // `info_requested` n'a volontairement pas d'action principale : la balle est
  // dans le camp du fidèle. Ses transitions restent accessibles en secondaire.
  let primary: PrimaryAction | null = null;

  if (status === 'submitted') {
    primary = {
      label: ACTION_LABELS.startVerification,
      icon: <Play className="size-4" aria-hidden="true" />,
      variant: 'default',
      isPending: startVerification.isPending,
      run: () => startVerification.mutate(requestId),
    };
  } else if (status === 'under_verification') {
    primary = {
      label: ACTION_LABELS.validate,
      icon: <CheckCircle className="size-4" aria-hidden="true" />,
      variant: 'default',
      isPending: validate.isPending,
      run: () => validate.mutate({ requestId }),
    };
  } else if (status === 'validated') {
    primary = {
      label: ACTION_LABELS.deposit,
      icon: <PenLine className="size-4" aria-hidden="true" />,
      variant: 'gold',
      isPending: deposit.isPending || uploadFile.isPending,
      // Déposer suppose de joindre l'acte signé : on ouvre le dialogue au lieu
      // d'envoyer une requête sans fichier, qui échouait en 400.
      run: () => setDepositOpen(true),
    };
  }

  const submitDeposit = () => {
    if (!depositFile) return;
    setDepositError(null);
    uploadFile.mutate(depositFile, {
      onSuccess: ({ id }) =>
        deposit.mutate(
          { requestId, fileId: id, label: 'Document officiel' },
          {
            onSuccess: () => {
              setDepositOpen(false);
              setDepositFile(null);
              addNotification({
                type: 'success',
                title: 'Document déposé',
                message: 'Le fidèle le retrouve dans son coffre-fort.',
              });
            },
            onError: () =>
              setDepositError(
                "Le dépôt a échoué. Le document a bien été envoyé, vous pouvez réessayer.",
              ),
          },
        ),
      onError: () =>
        setDepositError("L'envoi du document a échoué. Réessayez."),
    });
  };

  return (
    <>
      <div
        className={cn(
          'flex items-center gap-2',
          fullWidthPrimary ? 'w-full' : 'justify-end',
        )}
      >
        {primary && (
          <Button
            variant={primary.variant}
            size="sm"
            // 44px de haut sur mobile (cible tactile), 32px sur desktop où la
            // densité de la file prime.
            className={cn('h-11 md:h-8', fullWidthPrimary && 'flex-1')}
            icon={primary.icon}
            isLoading={primary.isPending}
            onClick={primary.run}
          >
            {primary.label}
            <span className="sr-only"> — {subject}</span>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Actions pour ${subject}`}
            >
              <MoreHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {(status === 'under_verification' ||
              status === 'info_requested') && (
              <DropdownMenuItem onSelect={() => setInfoOpen(true)}>
                <Info className="mr-2 size-4" aria-hidden="true" />
                {ACTION_LABELS.requestInfo}
              </DropdownMenuItem>
            )}

            {status === 'info_requested' && (
              <DropdownMenuItem
                disabled={validate.isPending}
                onSelect={() => validate.mutate({ requestId })}
              >
                <CheckCircle className="mr-2 size-4" aria-hidden="true" />
                {ACTION_LABELS.validate}
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
              onSelect={() => setRejectOpen(true)}
            >
              <XCircle className="mr-2 size-4" aria-hidden="true" />
              {ACTION_LABELS.reject}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dépôt du document signé — l'acte terminal du workflow */}
      <Dialog
        open={depositOpen}
        onOpenChange={(open) => {
          setDepositOpen(open);
          if (!open) {
            setDepositFile(null);
            setDepositError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Signer et déposer le document</DialogTitle>
            <DialogDescription>
              Joignez l’acte signé au format PDF. Il sera déposé dans le
              coffre-fort numérique du fidèle, qui en sera averti par email.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="deposit-file"
              className="text-sm font-medium text-foreground"
            >
              Document signé (PDF, 10 Mo maximum)
            </label>
            <input
              id="deposit-file"
              type="file"
              accept={DEPOSIT_ACCEPT}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && file.size > DEPOSIT_MAX_BYTES) {
                  setDepositFile(null);
                  setDepositError('Le fichier dépasse 10 Mo.');
                  return;
                }
                setDepositError(null);
                setDepositFile(file);
              }}
              className="block w-full cursor-pointer rounded-lg border border-input bg-background p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
            />
            {depositError && (
              <p role="alert" className="text-sm text-destructive">
                {depositError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="gold"
              onClick={submitDeposit}
              disabled={!depositFile || uploadFile.isPending || deposit.isPending}
              isLoading={uploadFile.isPending || deposit.isPending}
            >
              Déposer le document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request info dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander des informations complémentaires</DialogTitle>
            <DialogDescription>
              Le requérant recevra un email avec votre message.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={infoMessage}
            onChange={(e) => setInfoMessage(e.target.value)}
            rows={4}
            aria-label="Message pour le requérant"
            placeholder="Message pour le requérant..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => {
                requestInfo.mutate(
                  { requestId, message: infoMessage },
                  {
                    onSuccess: () => {
                      setInfoOpen(false);
                      setInfoMessage('');
                    },
                  },
                );
              }}
              disabled={!infoMessage.trim() || requestInfo.isPending}
              isLoading={requestInfo.isPending}
            >
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la demande</DialogTitle>
            <DialogDescription>
              Le requérant recevra un email avec le motif de rejet.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            aria-label="Motif du rejet"
            placeholder="Motif du rejet..."
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                reject.mutate(
                  { requestId, reason: rejectReason },
                  {
                    onSuccess: () => {
                      setRejectOpen(false);
                      setRejectReason('');
                    },
                  },
                );
              }}
              disabled={!rejectReason.trim() || reject.isPending}
              isLoading={reject.isPending}
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
