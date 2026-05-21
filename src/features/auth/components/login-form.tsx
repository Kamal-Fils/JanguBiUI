'use client';

import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Form, Input } from '@/components/ui/form';
import { paths } from '@/config/paths';
import { useLogin, loginInputSchema } from '@/lib/auth';

type LoginFormProps = {
  onSuccess: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const login = useLogin({
    onSuccess,
  });

  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirectTo');
  return (
    <div>
      <Form
        onSubmit={(values) => {
          login.mutate(values);
        }}
        schema={loginInputSchema}
      >
        {({ register, formState }) => (
          <>
            <Input
              type="email"
              label="Adresse email"
              error={formState.errors['email']}
              registration={register('email')}
            />
            <Input
              type="password"
              label="Mot de passe"
              error={formState.errors['password']}
              registration={register('password')}
            />
            <div className="flex justify-end text-sm">
              <NextLink
                className="font-medium text-primary hover:text-primary/80"
                href={paths.auth.forgotPassword.getHref()}
              >
                Mot de passe oublié ?
              </NextLink>
            </div>
            <div>
              <Button
                isLoading={login.isPending}
                type="submit"
                className="w-full"
              >
                Se connecter
              </Button>
            </div>
          </>
        )}
      </Form>
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{' '}
        <NextLink
          href={paths.auth.register.getHref(redirectTo)}
          className="font-semibold text-primary hover:text-primary/80"
        >
          Créer un compte
        </NextLink>
      </div>
    </div>
  );
};
