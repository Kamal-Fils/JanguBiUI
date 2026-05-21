'use client';

import { CheckCircle, Info, PackageCheck, Send, XCircle } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';

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
}

export function DocumentStatusActions({
  requestId,
  status,
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
      <div className="flex flex-wrap gap-2">
        {status === 'submitted' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => startVerification.mutate(requestId)}
            disabled={startVerification.isPending}
          >
            {startVerification.isPending ? (
              <Spinner className="size-3" />
            ) : (
              <Send className="mr-1.5 size-3.5" />
            )}
            Démarrer vérification
          </Button>
        )}

        {(status === 'under_verification' || status === 'info_requested') && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setInfoOpen(true)}
            >
              <Info className="mr-1.5 size-3.5" />
              Demander info
            </Button>
            <Button
              size="sm"
              onClick={() => validate.mutate({ requestId })}
              disabled={validate.isPending}
            >
              {validate.isPending ? (
                <Spinner className="size-3" />
              ) : (
                <CheckCircle className="mr-1.5 size-3.5" />
              )}
              Valider
            </Button>
          </>
        )}

        {status === 'validated' && (
          <Button
            size="sm"
            onClick={() => deposit.mutate({ requestId })}
            disabled={deposit.isPending}
          >
            {deposit.isPending ? (
              <Spinner className="size-3" />
            ) : (
              <PackageCheck className="mr-1.5 size-3.5" />
            )}
            Marquer déposé
          </Button>
        )}

        <Button
          size="sm"
          variant="destructive"
          onClick={() => setRejectOpen(true)}
        >
          <XCircle className="mr-1.5 size-3.5" />
          Rejeter
        </Button>
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
          <textarea
            value={infoMessage}
            onChange={(e) => setInfoMessage(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
            >
              {requestInfo.isPending ? (
                <Spinner className="size-4" />
              ) : (
                'Envoyer'
              )}
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
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
            >
              {reject.isPending ? <Spinner className="size-4" /> : 'Rejeter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
