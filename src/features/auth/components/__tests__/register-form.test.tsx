import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { RegisterForm } from '../register-form';

const onSuccess = vi.fn();

describe('RegisterForm', () => {
  beforeEach(() => {
    onSuccess.mockReset();
  });

  test('renders all required fields', () => {
    renderApp(<RegisterForm onSuccess={onSuccess} />);

    expect(screen.getByLabelText(/civilité/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
    // Use exact match for Nom to avoid matching Prénom
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/téléphone/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(
      screen.getByLabelText(/confirmer le mot de passe/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /créer mon compte/i }),
    ).toBeInTheDocument();
  });

  test('shows validation error when email field is empty', async () => {
    renderApp(<RegisterForm onSuccess={onSuccess} />);

    // Fill all fields except email, then submit to trigger required validation
    await userEvent.selectOptions(screen.getByLabelText(/civilité/i), 'MR');
    await userEvent.type(screen.getByLabelText(/prénom/i), 'Jean');
    await userEvent.type(screen.getByLabelText('Nom'), 'Dupont');
    await userEvent.type(screen.getByLabelText(/téléphone/i), '+221770000000');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123');
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'password123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /créer mon compte/i }),
    );

    // Zod schema: z.string().min(1, 'Requis').email('Email invalide')
    await screen.findByText(/requis/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('shows error when passwords do not match', async () => {
    renderApp(<RegisterForm onSuccess={onSuccess} />);

    await userEvent.selectOptions(screen.getByLabelText(/civilité/i), 'MR');
    await userEvent.type(screen.getByLabelText(/prénom/i), 'Jean');
    await userEvent.type(screen.getByLabelText('Nom'), 'Dupont');
    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'jean@example.com',
    );
    await userEvent.type(screen.getByLabelText(/téléphone/i), '+221770000000');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123');
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'different',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /créer mon compte/i }),
    );

    await screen.findByText(/les mots de passe ne correspondent pas/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('shows error when password is shorter than 8 characters', async () => {
    renderApp(<RegisterForm onSuccess={onSuccess} />);

    await userEvent.selectOptions(screen.getByLabelText(/civilité/i), 'MR');
    await userEvent.type(screen.getByLabelText(/prénom/i), 'Jean');
    await userEvent.type(screen.getByLabelText('Nom'), 'Dupont');
    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'jean@example.com',
    );
    await userEvent.type(screen.getByLabelText(/téléphone/i), '+221770000000');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'short');
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'short',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /créer mon compte/i }),
    );

    await screen.findByText(/minimum 8 caractères/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  test('calls onSuccess after successful registration', async () => {
    renderApp(<RegisterForm onSuccess={onSuccess} />);

    await userEvent.selectOptions(screen.getByLabelText(/civilité/i), 'MRS');
    await userEvent.type(screen.getByLabelText(/prénom/i), 'Marie');
    await userEvent.type(screen.getByLabelText('Nom'), 'Diallo');
    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'marie@example.com',
    );
    await userEvent.type(screen.getByLabelText(/téléphone/i), '+221770000001');
    await userEvent.type(
      screen.getByLabelText('Mot de passe'),
      'motdepasse123',
    );
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'motdepasse123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /créer mon compte/i }),
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
  });

  test('does not include confirmPassword in the request body', async () => {
    const capturedBodies: unknown[] = [];
    server.use(
      http.post(`${env.API_URL}/v1/users/register/`, async ({ request }) => {
        const body = await request.json();
        capturedBodies.push(body);
        return HttpResponse.json(
          {
            access: 'tok',
            refresh: 'ref',
            user: {
              id: '1',
              email: 'marie@example.com',
              role: 'fidele',
              is_active: true,
              is_verified: true,
              is_admin: false,
              is_staff: false,
              profile: { first_name: 'Marie', last_name: 'Diallo' },
            },
          },
          { status: 201 },
        );
      }),
    );

    renderApp(<RegisterForm onSuccess={onSuccess} />);

    await userEvent.selectOptions(screen.getByLabelText(/civilité/i), 'MRS');
    await userEvent.type(screen.getByLabelText(/prénom/i), 'Marie');
    await userEvent.type(screen.getByLabelText('Nom'), 'Diallo');
    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'marie@example.com',
    );
    await userEvent.type(screen.getByLabelText(/téléphone/i), '+221770000001');
    await userEvent.type(
      screen.getByLabelText('Mot de passe'),
      'motdepasse123',
    );
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'motdepasse123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /créer mon compte/i }),
    );

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).not.toHaveProperty('confirmPassword');
  });

  test('shows error notification when email is already taken', async () => {
    server.use(
      http.post(`${env.API_URL}/v1/users/register/`, () =>
        HttpResponse.json(
          { message: 'Un compte existe déjà avec cet email.' },
          { status: 400 },
        ),
      ),
    );

    renderApp(<RegisterForm onSuccess={onSuccess} />);

    await userEvent.selectOptions(screen.getByLabelText(/civilité/i), 'MR');
    await userEvent.type(screen.getByLabelText(/prénom/i), 'Jean');
    await userEvent.type(screen.getByLabelText('Nom'), 'Dupont');
    await userEvent.type(
      screen.getByLabelText(/adresse email/i),
      'taken@test.com',
    );
    await userEvent.type(screen.getByLabelText(/téléphone/i), '+221770000000');
    await userEvent.type(screen.getByLabelText('Mot de passe'), 'password123');
    await userEvent.type(
      screen.getByLabelText(/confirmer le mot de passe/i),
      'password123',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /créer mon compte/i }),
    );

    await screen.findByText(/un compte existe déjà avec cet email/i);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
