'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import NextLink from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button/button';
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
      {submitted ? (
        <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
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

          <Button
            type="submit"
            size="lg"
            fullWidth
            isLoading={isPending}
            disabled={!isValid}
          >
            {isPending ? 'Envoi en cours…' : 'Envoyer le lien'}
          </Button>
        </form>
      )}

      <div className="mt-2 text-center text-sm">
        <NextLink
          href={paths.auth.login.getHref()}
          className="font-medium text-primary hover:text-primary/80"
        >
          Retour à la connexion
        </NextLink>
      </div>
    </div>
  );
};
