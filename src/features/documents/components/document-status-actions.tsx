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
import { Textarea } from '@/components/ui/textarea';

import {
  useDepositDocument,
  useRejectDocument,
  useRequestInfo,
  useStartVerification,
  useValidateDocument,
} from '../api/admin-actions';
import { DocumentStatus } from '../types';

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

interface DocumentStatusActionsProps {
  requestId: string;
  status: DocumentStatus;
  /** Description humaine de la demande (ex. « Baptême de A. Ndiaye »). */
  subject?: string;
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
}: DocumentStatusActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  const startVerification = useStartVerification();
  const requestInfo = useRequestInfo();
  const validate = useValidateDocument();
  const reject = useRejectDocument();
  const deposit = useDepositDocument();

  if (status === 'rejected' || status === 'document_deposited') return null;

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
      isPending: deposit.isPending,
      run: () => deposit.mutate({ requestId }),
    };
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        {primary && (
          <Button
            variant={primary.variant}
            size="sm"
            className="h-10 md:h-8"
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
