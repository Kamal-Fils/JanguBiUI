import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { LoginForm } from '../login-form';

const onSuccess = vi.fn();

describe('LoginForm', () => {
  beforeEach(() => {
    onSuccess.mockReset();
  });

  test('renders email and password fields', () => {
    renderApp(<LoginForm onSuccess={onSuccess} />);

    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /se connecter/i }),
    ).toBeInTheDocument();
  });

  test('renders link to forgot password and register', () => {
    renderApp(<LoginForm onSuccess={onSuccess} />);

    expect(
      screen.getByRole('link', { name: /mot de passe oublié/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /créer un compte/i }),
    ).toBeInTheDocument();
  });

  test('shows validation error when email field is empty', async () => {
    renderApp(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await screen.findByText(/requis/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('shows required validation errors when fields are empty', async () => {
    renderApp(<LoginForm onSuccess={onSuccess} />);

    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    const requiredErrors = await screen.findAllByText(/requis/i);
    expect(requiredErrors.length).toBeGreaterThanOrEqual(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('calls onSuccess after successful login', async () => {
    renderApp(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'user@example.com',
    );
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  test('sends correct credentials to /v1/auth/jwt/login/', async () => {
    const capturedBodies: unknown[] = [];
    server.use(
      http.post(`${env.API_URL}/v1/auth/jwt/login/`, async ({ request }) => {
        const body = await request.json();
        capturedBodies.push(body);
        return HttpResponse.json({
          access: 'tok',
          refresh: 'ref',
          user: {
            id: '1',
            email: 'user@example.com',
            role: 'fidele',
            is_active: true,
            is_verified: true,
            is_admin: false,
            is_staff: false,
            profile: { first_name: 'Test', last_name: 'User' },
          },
        });
      }),
    );

    renderApp(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'user@example.com',
    );
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).toEqual({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  test('does not call onSuccess when API returns 401', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/auth/jwt/login/`, () =>
        HttpResponse.json(
          { message: 'Email ou mot de passe incorrect.' },
          { status: 401 },
        ),
      ),
    );

    renderApp(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'invalid@test.com',
    );
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    // Button should return to non-loading state after the error
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /se connecter/i }),
      ).not.toBeDisabled();
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
