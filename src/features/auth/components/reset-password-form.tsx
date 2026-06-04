'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Loader2 } from 'lucide-react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { paths } from '@/config/paths';
import { useConfirmPasswordReset } from '@/lib/auth';

const schema = z
  .object({
    new_password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm_password'],
  });

type FormValues = z.infer<typeof schema>;

export const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';

  const [done, setDone] = useState(false);

  const { mutate, isPending } = useConfirmPasswordReset({
    onSuccess: () => setDone(true),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Le lien de réinitialisation est invalide ou a expiré. Veuillez
          recommencer la procédure.
        </div>
        <NextLink
          href={paths.auth.forgotPassword.getHref()}
          className="text-center text-sm font-medium text-primary hover:text-primary/80"
        >
          Demander un nouveau lien
        </NextLink>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <CheckCircle2 className="size-12 text-success" />
        <p className="text-sm font-medium text-foreground">
          Mot de passe réinitialisé avec succès
        </p>
        <NextLink
          href={paths.auth.login.getHref()}
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Se connecter
        </NextLink>
      </div>
    );
  }

  function onSubmit(values: FormValues) {
    mutate({ token, new_password: values.new_password });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="new_password"
          className="text-sm font-semibold text-foreground"
        >
          Nouveau mot de passe
        </label>
        <input
          id="new_password"
          type="password"
          autoComplete="new-password"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          {...register('new_password')}
        />
        {errors.new_password && (
          <p className="text-xs text-destructive" role="alert">
            {errors.new_password.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirm_password"
          className="text-sm font-semibold text-foreground"
        >
          Confirmer le mot de passe
        </label>
        <input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          {...register('confirm_password')}
        />
        {errors.confirm_password && (
          <p className="text-xs text-destructive" role="alert">
            {errors.confirm_password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {isPending ? 'Enregistrement…' : 'Réinitialiser'}
      </button>
    </form>
  );
};
