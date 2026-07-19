import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import * as React from 'react';

import { env } from '@/config/env';
import {
  api,
  AUTH_TRANSPORT_COOKIE,
  AUTH_TRANSPORT_HEADER,
  clearAccessToken,
  clearSession,
  getAccessToken,
  getSessionState,
  hasPotentialSession,
  setAccessToken,
} from '@/lib/api-client';
import { useLogin, useLogout } from '@/lib/auth';
import { createUser } from '@/testing/data-generators';
import { server } from '@/testing/mocks/server';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('Auth token side-effects', () => {
  beforeEach(() => {
    clearAccessToken();
  });

  test('login stocke le access token en mémoire', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: 'user@test.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Le handler MSW retourne access: 'fake-access-token'
    expect(getAccessToken()).toBe('fake-access-token');
  });

  test("le refresh token n'est JAMAIS écrit dans localStorage", async () => {
    // Cœur du changement : un refresh token (7 jours) lisible par n'importe
    // quel script de la page transformait une XSS en prise de compte
    // persistante. Il vit désormais dans un cookie HttpOnly.
    const setItem = vi.spyOn(Storage.prototype, 'setItem');

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: 'user@test.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(setItem).not.toHaveBeenCalled();
    expect(localStorage.getItem('jb_refresh_token')).toBeNull();
  });

  test('le login réclame le transport par cookie au serveur', async () => {
    // Sans cet en-tête, le serveur renverrait le jeton dans le corps (mode
    // mobile) et le bénéfice serait perdu.
    let capturedTransport: string | null = null;
    server.use(
      http.post(`${env.API_URL}/v1/auth/jwt/login/`, ({ request }) => {
        capturedTransport = request.headers.get(AUTH_TRANSPORT_HEADER);
        return HttpResponse.json({
          access: 'fake-access-token',
          user: createUser(),
        });
      }),
    );

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: 'user@test.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedTransport).toBe(AUTH_TRANSPORT_COOKIE);
  });

  test('une réponse de login sans refresh est acceptée', async () => {
    // En mode cookie le serveur OMET `refresh` du corps : le client ne doit ni
    // planter ni considérer la session comme invalide.
    server.use(
      http.post(`${env.API_URL}/v1/auth/jwt/login/`, () =>
        HttpResponse.json({ access: 'cookie-mode-access', user: createUser() }),
      ),
    );

    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: 'user@test.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getAccessToken()).toBe('cookie-mode-access');
    expect(getSessionState()).toBe('active');
  });

  test('api.get inclut Authorization: Bearer quand un token est présent', async () => {
    setAccessToken('my-bearer-token');

    let capturedAuthHeader: string | null = null;
    server.use(
      http.get(`${env.API_URL}/v1/auth/me/`, ({ request }) => {
        capturedAuthHeader = request.headers.get('authorization');
        return HttpResponse.json(createUser());
      }),
    );

    await api.get('/v1/auth/me/');

    expect(capturedAuthHeader).toBe('Bearer my-bearer-token');
  });

  test("les appels d'API ordinaires ne portent pas l'en-tête de transport", async () => {
    // L'en-tête n'est pas safelisté CORS : le poser partout imposerait un
    // preflight sur chaque requête, pour rien.
    setAccessToken('tok');

    let capturedTransport: string | null = 'sentinel';
    server.use(
      http.get(`${env.API_URL}/v1/auth/me/`, ({ request }) => {
        capturedTransport = request.headers.get(AUTH_TRANSPORT_HEADER);
        return HttpResponse.json(createUser());
      }),
    );

    await api.get('/v1/auth/me/');

    expect(capturedTransport).toBeNull();
  });

  test('logout envoie une requête sans refresh dans le corps', async () => {
    // Le serveur lit le jeton dans le cookie ; le client n'a plus rien à fournir.
    setAccessToken('tok');

    let capturedBody: unknown = 'sentinel';
    server.use(
      http.post(`${env.API_URL}/v1/auth/jwt/logout/`, async ({ request }) => {
        capturedBody = await request.text();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedBody).toBe('');
  });

  test('logout efface le access token et marque la session anonyme', async () => {
    setAccessToken('tok');

    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getAccessToken()).toBeNull();
    expect(getSessionState()).toBe('anonymous');
    expect(hasPotentialSession()).toBe(false);
  });

  test('clearSession coupe la présomption de session', () => {
    setAccessToken('tok');
    expect(hasPotentialSession()).toBe(true);

    clearSession();

    expect(getAccessToken()).toBeNull();
    expect(hasPotentialSession()).toBe(false);
  });
});
