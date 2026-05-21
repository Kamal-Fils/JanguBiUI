'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button/button';
import { Spinner } from '@/components/ui/spinner';
import { useDioceses } from '@/features/org/api/get-dioceses';

import { useCreateInvitation } from '../api/create-invitation';

const schema = z.object({
  email: z.string().email('Email invalide'),
  first_name: z.string().min(1, 'Prénom requis'),
  last_name: z.string().min(1, 'Nom requis'),
  pastoral_role: z.enum(
    ['pretre', 'diacre', 'religieux', 'eveque', 'archeveque'],
    {
      required_error: 'Rôle requis',
    },
  ),
  diocese_id: z.coerce.number().optional().nullable(),
});

export type InvitationFormValues = z.infer<typeof schema>;

interface InvitationFormProps {
  onSuccess?: () => void;
}

export function InvitationForm({ onSuccess }: InvitationFormProps) {
  const { data: dioceses = [] } = useDioceses();
  const createInvitation = useCreateInvitation({ onSuccess });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvitationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      diocese_id: null,
    },
  });

  const onSubmit = (values: InvitationFormValues) => {
    createInvitation.mutate(values);
  };

  const labelClass = 'block text-sm font-medium text-foreground mb-1';
  const inputClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className={labelClass}>
            Prénom
          </label>
          <input
            id="first_name"
            {...register('first_name')}
            className={inputClass}
            placeholder="Abbé"
          />
          {errors.first_name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.first_name.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="last_name" className={labelClass}>
            Nom
          </label>
          <input
            id="last_name"
            {...register('last_name')}
            className={inputClass}
            placeholder="Sène"
          />
          {errors.last_name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.last_name.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          {...register('email')}
          type="email"
          className={inputClass}
          placeholder="pretre@diocese.sn"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="pastoral_role" className={labelClass}>
          Rôle pastoral
        </label>
        <select
          id="pastoral_role"
          {...register('pastoral_role')}
          className={inputClass}
        >
          <option value="">-- Choisir --</option>
          <option value="pretre">Prêtre</option>
          <option value="diacre">Diacre</option>
          <option value="religieux">Religieux/Religieuse</option>
          <option value="eveque">Évêque</option>
          <option value="archeveque">Archevêque</option>
        </select>
        {errors.pastoral_role && (
          <p className="mt-1 text-xs text-destructive">
            {errors.pastoral_role.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="diocese_id" className={labelClass}>
          Diocèse (optionnel)
        </label>
        <select
          id="diocese_id"
          {...register('diocese_id')}
          className={inputClass}
        >
          <option value="">-- Aucun --</option>
          {dioceses.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={createInvitation.isPending}
      >
        {createInvitation.isPending ? (
          <Spinner className="size-4" />
        ) : (
          "Envoyer l'invitation"
        )}
      </Button>
    </form>
  );
}
