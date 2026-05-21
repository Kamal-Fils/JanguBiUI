import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useSearchParams } from 'next/navigation';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { ResetPasswordForm } from '../reset-password-form';

// useSearchParams is mocked as vi.fn() in setup-tests.ts
// Default returns { get: () => null } (no token)
// Per-test overrides set it to return a token

const mockUseSearchParams = vi.mocked(useSearchParams);

function withToken(token: string) {
  mockUseSearchParams.mockReturnValue({
    get: (key: string) => (key === 'token' ? token : null),
  } as never);
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    // Reset to default (no token)
    mockUseSearchParams.mockReturnValue({
      get: vi.fn().mockReturnValue(null),
    } as never);
  });

  test('shows invalid link message when no token is present', () => {
    renderApp(<ResetPasswordForm />);

    expect(
      screen.getByText(/le lien de réinitialisation est invalide ou a expiré/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /demander un nouveau lien/i }),
    ).toBeInTheDocument();
  });

  test('renders the password fields when a token is present', () => {
    withToken('valid-token');
    renderApp(<ResetPasswordForm />);

    expect(screen.getByLabelText(/nouveau mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/confirmer le mot de passe/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /réinitialiser/i }),
    ).toBeInTheDocument();
  });

  test('shows error when new password is shorter than 8 characters', async () => {
    withToken('valid-token');
    renderApp(<ResetPasswordForm />);

    await userEvent.type(
      screen.getByLabelText(/nouveau mot de passe/i),
      'short',
    );
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'short',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /réinitialiser/i }),
    );

    await screen.findByRole('alert');
  });

  test('shows error when passwords do not match', async () => {
    withToken('valid-token');
    renderApp(<ResetPasswordForm />);

    await userEvent.type(
      screen.getByLabelText(/nouveau mot de passe/i),
      'password123',
    );
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'different456',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /réinitialiser/i }),
    );

    await screen.findByText(/les mots de passe ne correspondent pas/i);
  });

  test('calls /v1/users/password/reset/confirm/ with token and new_password on valid submit', async () => {
    withToken('valid-token');

    const capturedBodies: unknown[] = [];
    server.use(
      http.post(
        `${env.API_URL}/v1/users/password/reset/confirm/`,
        async ({ request }) => {
          const body = await request.json();
          capturedBodies.push(body);
          return HttpResponse.json({ detail: 'Mot de passe réinitialisé.' });
        },
      ),
    );

    renderApp(<ResetPasswordForm />);

    await userEvent.type(
      screen.getByLabelText(/nouveau mot de passe/i),
      'newpassword123',
    );
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'newpassword123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /réinitialiser/i }),
    );

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).toEqual({
      token: 'valid-token',
      new_password: 'newpassword123',
    });
  });

  test('shows success message after password reset', async () => {
    withToken('valid-token');

    renderApp(<ResetPasswordForm />);

    await userEvent.type(
      screen.getByLabelText(/nouveau mot de passe/i),
      'newpassword123',
    );
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'newpassword123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /réinitialiser/i }),
    );

    await screen.findByText(/mot de passe réinitialisé avec succès/i);
  });
});
