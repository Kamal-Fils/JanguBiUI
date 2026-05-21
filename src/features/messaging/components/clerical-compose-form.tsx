'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/auth';
import { isEvequeOrAbove } from '@/lib/authorization';

import { useSendClericalMessage } from '../api/send-clerical-message';

const schema = z.object({
  subject: z.string().min(1, 'Sujet requis').max(200),
  body: z.string().min(1, 'Message requis'),
  recipient_scope: z.enum([
    'individual',
    'parish_clergy',
    'diocese_clergy',
    'province_bishops',
  ]),
  scope_id: z.number().optional(),
  individual_recipient_id: z.number().optional(),
});

type FormInput = z.infer<typeof schema>;

const SCOPE_OPTIONS = [
  { value: 'individual', label: 'Individuel' },
  { value: 'parish_clergy', label: 'Clergé de la paroisse' },
  { value: 'diocese_clergy', label: 'Clergé du diocèse' },
  { value: 'province_bishops', label: 'Évêques de la province' },
] as const;

interface ClericalComposeFormProps {
  onSuccess?: () => void;
}

export function ClericalComposeForm({ onSuccess }: ClericalComposeFormProps) {
  const { data: user } = useUser();
  const { mutate, isPending } = useSendClericalMessage({ onSuccess });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { recipient_scope: 'individual' },
  });

  const scope = watch('recipient_scope');

  const availableScopes = SCOPE_OPTIONS.filter((opt) => {
    if (opt.value === 'province_bishops') return isEvequeOrAbove(user);
    return true;
  });

  const onSubmit = (data: FormInput) => {
    mutate({
      subject: data.subject,
      body: data.body,
      recipient_scope: data.recipient_scope,
      scope_id: data.scope_id ?? null,
      individual_recipient_id: data.individual_recipient_id ?? null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-4">
      <div>
        <label
          htmlFor="recipient_scope"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Destinataires
        </label>
        <select
          id="recipient_scope"
          {...register('recipient_scope')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {availableScopes.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.recipient_scope && (
          <p className="mt-1 text-xs text-red-500">
            {errors.recipient_scope.message}
          </p>
        )}
      </div>

      {scope === 'individual' && (
        <div>
          <label
            htmlFor="individual_recipient_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ID du destinataire
          </label>
          <input
            id="individual_recipient_id"
            type="number"
            {...register('individual_recipient_id', { valueAsNumber: true })}
            placeholder="ID utilisateur"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {(scope === 'parish_clergy' ||
        scope === 'diocese_clergy' ||
        scope === 'province_bishops') && (
        <div>
          <label
            htmlFor="scope_id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ID du territoire (paroisse / diocèse / province)
          </label>
          <input
            id="scope_id"
            type="number"
            {...register('scope_id', { valueAsNumber: true })}
            placeholder="ID territoire"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Sujet
        </label>
        <input
          id="subject"
          type="text"
          {...register('subject')}
          placeholder="Objet du message"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.subject && (
          <p className="mt-1 text-xs text-red-500">{errors.subject.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="body"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Message
        </label>
        <textarea
          id="body"
          {...register('body')}
          rows={6}
          placeholder="Votre message…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {errors.body && (
          <p className="mt-1 text-xs text-red-500">{errors.body.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        <Send className="mr-2 h-4 w-4" />
        {isPending ? 'Envoi…' : 'Envoyer'}
      </Button>
    </form>
  );
}
