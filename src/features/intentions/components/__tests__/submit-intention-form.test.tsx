import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { env } from '@/config/env';
import { server } from '@/testing/mocks/server';
import { renderApp } from '@/testing/test-utils';

import { SubmitIntentionForm } from '../submit-intention-form';

const SUBMIT_URL = `${env.API_URL}/v1/mass-intentions/submit/`;

describe('SubmitIntentionForm', () => {
  test('validation : une intention trop courte est bloquée sans appel réseau', async () => {
    let called = false;
    server.use(
      http.post(SUBMIT_URL, () => {
        called = true;
        return HttpResponse.json({}, { status: 201 });
      }),
    );

    renderApp(<SubmitIntentionForm />);

    await userEvent.type(screen.getByLabelText(/votre intention/i), 'Trop c');
    await userEvent.click(
      screen.getByRole('button', { name: /confier mon intention/i }),
    );

    expect(
      await screen.findByText(
        'Veuillez décrire votre intention (min. 10 caractères)',
      ),
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  test('soumission : envoie le type choisi + le texte, puis notifie le succès', async () => {
    let body: Record<string, unknown> | null = null;
    server.use(
      http.post(SUBMIT_URL, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const onSuccess = vi.fn();

    renderApp(<SubmitIntentionForm onSuccess={onSuccess} />);

    await userEvent.selectOptions(
      screen.getByLabelText(/type d'intention/i),
      'for_living',
    );
    await userEvent.type(
      screen.getByLabelText(/votre intention/i),
      'Pour la guérison de ma mère malade.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confier mon intention/i }),
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(body).toEqual({
      intention_type: 'for_living',
      intention_text: 'Pour la guérison de ma mère malade.',
    });
    // Le formulaire est réinitialisé après succès.
    expect(screen.getByLabelText(/votre intention/i)).toHaveValue('');
  });

  test("échec serveur : un message d'erreur réessayable est affiché", async () => {
    server.use(
      http.post(SUBMIT_URL, () =>
        HttpResponse.json({ detail: 'Erreur' }, { status: 500 }),
      ),
    );

    renderApp(<SubmitIntentionForm />);

    await userEvent.type(
      screen.getByLabelText(/votre intention/i),
      'Pour une intention suffisamment longue.',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /confier mon intention/i }),
    );

    expect(
      await screen.findByText("L'envoi a échoué. Veuillez réessayer."),
    ).toBeInTheDocument();
  });
});
