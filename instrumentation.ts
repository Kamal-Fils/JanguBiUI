import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Capture les erreurs serveur (Server Components, route handlers, SSR) que le
// framework remonte au hook onRequestError (App Router, Next 15+).
export const onRequestError = Sentry.captureRequestError;
