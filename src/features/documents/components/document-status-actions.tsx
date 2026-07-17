'use client';

import {
  CheckCircle,
  Info,
  MoreHorizontal,
  PackageCheck,
  Send,
  XCircle,
} from 'lucide-react';
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

interface DocumentStatusActionsProps {
  requestId: string;
  status: DocumentStatus;
  /** Libellé accessible du menu « ⋯ » (ex. « Actions pour Baptême de A. Ndiaye »). */
  ariaLabel?: string;
}

/**
 * Workflow de traitement regroupé dans un menu « ⋯ » (pas de rangée de
 * boutons). Les transitions disponibles dépendent strictement du statut —
 * la logique métier (mutations, gardes) est inchangée.
 */
export function DocumentStatusActions({
  requestId,
  status,
  ariaLabel = 'Actions sur la demande',
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={ariaLabel}>
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {status === 'submitted' && (
            <DropdownMenuItem
              disabled={startVerification.isPending}
              onSelect={() => startVerification.mutate(requestId)}
            >
              <Send className="mr-2 size-4" aria-hidden="true" />
              Démarrer la vérification
            </DropdownMenuItem>
          )}

          {(status === 'under_verification' || status === 'info_requested') && (
            <>
              <DropdownMenuItem onSelect={() => setInfoOpen(true)}>
                <Info className="mr-2 size-4" aria-hidden="true" />
                Demander une information
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={validate.isPending}
                onSelect={() => validate.mutate({ requestId })}
              >
                <CheckCircle className="mr-2 size-4" aria-hidden="true" />
                Valider
              </DropdownMenuItem>
            </>
          )}

          {status === 'validated' && (
            <DropdownMenuItem
              disabled={deposit.isPending}
              onSelect={() => deposit.mutate({ requestId })}
            >
              <PackageCheck className="mr-2 size-4" aria-hidden="true" />
              Marquer déposé
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={() => setRejectOpen(true)}
          >
            <XCircle className="mr-2 size-4" aria-hidden="true" />
            Rejeter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
