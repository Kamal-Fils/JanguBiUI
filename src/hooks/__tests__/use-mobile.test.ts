import { act, renderHook } from '@testing-library/react';

import { useIsMobile } from '../use-mobile';

type MediaQueryListenerFn = (event: MediaQueryListEvent) => void;

function setupWindowWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
}

describe('useIsMobile', () => {
  let mediaQueryListener: MediaQueryListenerFn | null = null;
  let mockMql: {
    matches: boolean;
    media: string;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mediaQueryListener = null;
    mockMql = {
      matches: false,
      media: '',
      addEventListener: vi.fn(
        (event: string, listener: MediaQueryListenerFn) => {
          if (event === 'change') {
            mediaQueryListener = listener;
          }
        },
      ),
      removeEventListener: vi.fn(),
    };

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });
  });

  test('returns true when window.innerWidth is less than 768', () => {
    setupWindowWidth(375);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  test('returns false when window.innerWidth is exactly 768', () => {
    setupWindowWidth(768);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  test('returns false when window.innerWidth is greater than 768', () => {
    setupWindowWidth(1024);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  test('returns true for small phone widths (320px)', () => {
    setupWindowWidth(320);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });

  test('updates when window width changes via media query event', () => {
    setupWindowWidth(1024);

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    act(() => {
      setupWindowWidth(375);
      if (mediaQueryListener) {
        mediaQueryListener({} as MediaQueryListEvent);
      }
    });

    expect(result.current).toBe(true);
  });

  test('removes media query listener on unmount', () => {
    setupWindowWidth(500);

    const { unmount } = renderHook(() => useIsMobile());

    unmount();

    expect(mockMql.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});
