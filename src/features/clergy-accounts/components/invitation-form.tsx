'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button/button';
import { Input } from '@/components/ui/input';
import { useDioceses } from '@/lib/org/get-dioceses';

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

const LABEL_CLASS = 'mb-1 block text-sm font-medium text-foreground';
/** Style aligné sur `ui/input` — les <select> natifs restent natifs (RHF register). */
const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className={LABEL_CLASS}>
            Prénom
          </label>
          <Input id="first_name" {...register('first_name')} placeholder="Abbé" />
          {errors.first_name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.first_name.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="last_name" className={LABEL_CLASS}>
            Nom
          </label>
          <Input id="last_name" {...register('last_name')} placeholder="Sène" />
          {errors.last_name && (
            <p className="mt-1 text-xs text-destructive">
              {errors.last_name.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className={LABEL_CLASS}>
          Email
        </label>
        <Input
          id="email"
          {...register('email')}
          type="email"
          placeholder="pretre@diocese.sn"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="pastoral_role" className={LABEL_CLASS}>
          Rôle pastoral
        </label>
        <select
          id="pastoral_role"
          {...register('pastoral_role')}
          className={SELECT_CLASS}
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
        <label htmlFor="diocese_id" className={LABEL_CLASS}>
          Diocèse (optionnel)
        </label>
        <select
          id="diocese_id"
          {...register('diocese_id')}
          className={SELECT_CLASS}
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
        fullWidth
        disabled={createInvitation.isPending}
        isLoading={createInvitation.isPending}
      >
        Envoyer l&apos;invitation
      </Button>
    </form>
  );
}
