import '@testing-library/jest-dom/vitest';

import { server } from '@/testing/mocks/server';

vi.mock('zustand');

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => '/app'),
  useSearchParams: vi.fn(() => ({
    get: vi.fn().mockReturnValue(null),
  })),
  useParams: vi.fn(() => ({})),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterAll(() => server.close());

beforeEach(() => {
  const ResizeObserverMock = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
  vi.stubGlobal('ResizeObserver', ResizeObserverMock);

  // Mock WebSocket for chat socket tests
  vi.stubGlobal(
    'WebSocket',
    vi.fn(() => ({
      onmessage: null,
      onclose: null,
      onerror: null,
      onopen: null,
      close: vi.fn(),
      send: vi.fn(),
      readyState: 1,
    })),
  );

  // Mock scrollIntoView for jsdom (chat-window uses bottomRef.current?.scrollIntoView)
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  window.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
  window.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
