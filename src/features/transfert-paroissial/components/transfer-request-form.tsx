'use client';

import { useState } from 'react';

import { ParishSelector } from '@/features/org/components/parish-selector';

import { useCreateTransfer } from '../api/create-transfer';

interface TransferRequestFormProps {
  onSuccess: () => void;
}

export function TransferRequestForm({ onSuccess }: TransferRequestFormProps) {
  const [destinationParishId, setDestinationParishId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const { mutate: createTransfer, isPending } = useCreateTransfer({ onSuccess });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationParishId) return;
    createTransfer({ destination_parish_id: destinationParishId, reason: reason.trim() || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          Paroisse de destination
        </p>
        <ParishSelector value={destinationParishId} onChange={setDestinationParishId} />
      </div>

      <div>
        <label htmlFor="transfer-reason" className="mb-1.5 block text-sm font-medium text-foreground">
          Motif du transfert <span className="text-muted-foreground font-normal">(optionnel)</span>
        </label>
        <textarea
          id="transfer-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Déménagement, mariage, rapprochement familial…"
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={!destinationParishId || isPending}
        className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-opacity"
      >
        {isPending ? 'Envoi en cours…' : 'Soumettre la demande de transfert'}
      </button>
    </form>
  );
}
