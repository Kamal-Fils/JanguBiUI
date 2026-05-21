'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import NextLink from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { paths } from '@/config/paths';
import { useRequestPasswordReset } from '@/lib/auth';

const schema = z.object({
  email: z.string().email('Adresse email invalide'),
});

type FormValues = z.infer<typeof schema>;

export const ForgotPasswordForm = () => {
  const [submitted, setSubmitted] = useState(false);

  const { mutate, isPending } = useRequestPasswordReset({
    onSuccess: () => setSubmitted(true),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  });

  function onSubmit(values: FormValues) {
    mutate({ email: values.email });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Mot de passe oublié
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Entrez votre adresse email. Nous vous enverrons un lien pour
          réinitialiser votre mot de passe.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
          Si cette adresse est enregistrée, vous recevrez un email sous peu.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-semibold text-foreground"
            >
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              placeholder="vous@exemple.com"
              autoComplete="email"
              className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!isValid || isPending}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {isPending && <Loader2 className="size-4 animate-spin" />}
            {isPending ? 'Envoi en cours…' : 'Envoyer le lien'}
          </button>
        </form>
      )}

      <div className="mt-2 text-center text-sm">
        <NextLink
          href={paths.auth.login.getHref()}
          className="font-medium text-blue-600 hover:text-blue-500"
        >
          Retour à la connexion
        </NextLink>
      </div>
    </div>
  );
};
