import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ForgotPasswordForm } from '../forgot-password-form';

describe('ForgotPasswordForm', () => {
  test('renders the email field and submit button', () => {
    renderApp(<ForgotPasswordForm />);

    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /envoyer le lien/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /retour à la connexion/i }),
    ).toBeInTheDocument();
  });

  test('submit button is disabled when email is empty', () => {
    renderApp(<ForgotPasswordForm />);

    expect(
      screen.getByRole('button', { name: /envoyer le lien/i }),
    ).toBeDisabled();
  });

  test('submit button is enabled after typing a valid email', async () => {
    renderApp(<ForgotPasswordForm />);

    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'user@example.com',
    );

    expect(
      screen.getByRole('button', { name: /envoyer le lien/i }),
    ).toBeEnabled();
  });

  test('calls /v1/users/password/reset/request/ with correct email on submit', async () => {
    const capturedBodies: unknown[] = [];
    server.use(
      http.post(
        `${env.API_URL}/v1/users/password/reset/request/`,
        async ({ request }) => {
          const body = await request.json();
          capturedBodies.push(body);
          return HttpResponse.json({ detail: 'Email envoyé.' });
        },
      ),
    );

    renderApp(<ForgotPasswordForm />);

    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'user@example.com',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /envoyer le lien/i }),
    );

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).toEqual({ email: 'user@example.com' });
  });

  test('shows confirmation message after successful submission', async () => {
    renderApp(<ForgotPasswordForm />);

    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'user@example.com',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /envoyer le lien/i }),
    );

    await screen.findByText(
      /si cette adresse est enregistrée, vous recevrez un email sous peu/i,
    );
    expect(
      screen.queryByRole('button', { name: /envoyer le lien/i }),
    ).not.toBeInTheDocument();
  });

  test('does not submit when email field is only whitespace', async () => {
    const capturedBodies: unknown[] = [];
    server.use(
      http.post(
        `${env.API_URL}/v1/users/password/reset/request/`,
        async ({ request }) => {
          const body = await request.json();
          capturedBodies.push(body);
          return HttpResponse.json({});
        },
      ),
    );

    renderApp(<ForgotPasswordForm />);

    await userEvent.type(screen.getByLabelText(/adresse email/i), '   ');
    await userEvent.click(
      screen.getByRole('button', { name: /envoyer le lien/i }),
    );

    await waitFor(() => {
      expect(capturedBodies).toHaveLength(0);
    });
  });
});
