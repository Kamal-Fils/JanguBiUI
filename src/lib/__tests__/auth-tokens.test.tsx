import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import * as React from 'react';

import { env } from '@/config/env';
import {
  api,
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
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
    clearRefreshToken();
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

  test('login stocke le refresh token en mémoire', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ email: 'user@test.com', password: 'password123' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getRefreshToken()).toBe('fake-refresh-token');
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

  test('logout efface le access token et le refresh token', async () => {
    setAccessToken('tok');
    setRefreshToken('ref');

    // Le handler logout MSW retourne déjà {} — pas besoin d'override
    // Mais useLogout a besoin du refresh token dans le body
    const { result } = renderHook(() => useLogout(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(undefined);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
  });
});
