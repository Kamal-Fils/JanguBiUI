import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useRouter } from 'next/navigation';

import { env } from '@/config/env';
import { createDocumentRequest } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { NewDocumentForm } from '../new-document-form';

const mockRouterPush = vi.fn();
const mockRouterBack = vi.fn();

vi.mocked(useRouter).mockReturnValue({
  push: mockRouterPush,
  back: mockRouterBack,
  replace: vi.fn(),
  refresh: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
} as never);

/**
 * Fills every required field across steps 1–4, skips the optional
 * attachments step 5, so the caller arrives at step 6 (Validation / consent)
 * where the submit button lives.
 *
 * Step 1 – type + reason
 * Step 2 – identity (first name, last name, date of birth, place of birth)
 * Step 3 – sacrament search (parents, parish, diocese, date, location)
 * Step 4 – contact (phone + email)
 * Step 5 – attachments (optional, skipped)
 */
async function navigateToConsent(user: ReturnType<typeof userEvent.setup>) {
  // Step 1 — document type + reason
  await user.click(screen.getByRole('button', { name: 'Certificat de baptême' }));
  await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
  await user.click(screen.getByRole('button', { name: /continuer/i }));

  // Step 2 — identity
  await user.type(screen.getByLabelText(/prénom/i), 'Jean');
  await user.type(screen.getByLabelText(/^nom/i), 'Dupont');
  await user.type(screen.getByLabelText(/date de naissance/i), '2000-01-01');
  await user.type(screen.getByLabelText(/lieu de naissance/i), 'Dakar');
  await user.click(screen.getByRole('button', { name: /continuer/i }));

  // Step 3 — sacrament search
  await user.type(screen.getByLabelText(/nom du père/i), 'Dupont');
  await user.type(screen.getByLabelText(/nom de la mère/i), 'Martin');
  await user.type(screen.getByLabelText(/paroisse du sacrement/i), 'Saint-Pierre');
  await user.type(screen.getByLabelText(/diocèse/i), 'Dakar');
  await user.type(screen.getByLabelText(/date approx/i), '2000');
  await user.type(screen.getByLabelText(/^lieu/i), 'Dakar');
  await user.click(screen.getByRole('button', { name: /continuer/i }));

  // Step 4 — contact
  await user.type(screen.getByLabelText(/téléphone/i), '+221770000000');
  await user.type(screen.getByLabelText(/email/i), 'jean@example.com');
  await user.click(screen.getByRole('button', { name: /continuer/i }));

  // Step 5 — attachments (optional, skip without uploading)
  await user.click(screen.getByRole('button', { name: /continuer/i }));
}

describe('NewDocumentForm', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockRouterBack.mockReset();
  });

  test('renders all document type selection cards on step 1', () => {
    renderApp(<NewDocumentForm />);

    expect(
      screen.getByRole('button', { name: 'Certificat de baptême' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attestation de première communion' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attestation de confirmation' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attestation de mariage religieux' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attestation parrain / marraine' }),
    ).toBeInTheDocument();
  });

  test('shows validation errors when "Continuer" is clicked without selections on step 1', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);

    // Click Continuer without selecting anything — should show errors, not advance
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    // Should still be on step 1 (document type cards still visible)
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Certificat de baptême' }),
      ).toBeInTheDocument();
    });

    // After selecting both, clicking Continuer should advance to step 2
    await user.click(screen.getByRole('button', { name: 'Certificat de baptême' }));
    await user.click(screen.getByRole('button', { name: 'Usage personnel' }));
    await user.click(screen.getByRole('button', { name: /continuer/i }));

    // Now on step 2 — identity fields appear
    await waitFor(() => {
      expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
    });
  });

  test('"Envoyer la demande" appears on the final step and is disabled before consent', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);

    const submitBtn = screen.getByRole('button', { name: /envoyer la demande/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  test('consent checkbox enables "Envoyer la demande"', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);

    await user.click(screen.getByRole('button', { name: /je certifie/i }));

    expect(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    ).toBeEnabled();
  });

  test('sends POST with document_type value (not label) to /v1/documents/requests/', async () => {
    const capturedBodies: unknown[] = [];
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        async ({ request }) => {
          const body = await request.json();
          capturedBodies.push(body);
          return HttpResponse.json(
            createDocumentRequest({ document_type: 'baptism', status: 'submitted' }),
            { status: 201 },
          );
        },
      ),
    );

    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await waitFor(() => expect(capturedBodies).toHaveLength(1));
    expect(capturedBodies[0]).toMatchObject({
      document_type: 'baptism',
      consent_given: true,
    });
  });

  test('redirects to /app/documents after successful submission', async () => {
    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await waitFor(() =>
      expect(mockRouterPush).toHaveBeenCalledWith('/app/documents'),
    );
  });

  test('shows loading indicator while submitting', async () => {
    let resolveRequest!: () => void;
    server.use(
      http.post(
        `${env.API_URL}/v1/documents/requests/`,
        () =>
          new Promise<Response>((resolve) => {
            resolveRequest = () =>
              resolve(
                HttpResponse.json(
                  createDocumentRequest({
                    document_type: 'baptism',
                    status: 'submitted',
                  }),
                  { status: 201 },
                ),
              );
          }),
      ),
    );

    const user = userEvent.setup();
    renderApp(<NewDocumentForm />);
    await navigateToConsent(user);
    await user.click(screen.getByRole('button', { name: /je certifie/i }));
    await user.click(
      screen.getByRole('button', { name: /envoyer la demande/i }),
    );

    await screen.findByText(/envoi en cours/i);
    expect(
      screen.getByRole('button', { name: /envoi en cours/i }),
    ).toBeDisabled();

    resolveRequest();
  });
});
