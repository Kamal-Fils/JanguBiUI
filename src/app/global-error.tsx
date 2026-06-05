'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

/**
 * Frontière d'erreur racine (App Router). Rendue uniquement quand le layout
 * racine lui-même échoue — elle remplace donc tout l'arbre et doit fournir ses
 * propres <html>/<body> et des styles inline (aucune garantie que le pipeline CSS
 * ou les providers soient disponibles dans ce cas catastrophique).
 *
 * Capture l'erreur dans Sentry (les erreurs intra-arbre passent déjà par la
 * Sentry.ErrorBoundary du provider ; celle-ci couvre le dernier recours).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          color: '#e2e8f0',
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          padding: '24px',
        }}
      >
        <main
          style={{
            maxWidth: 420,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 13,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#70cbff',
              margin: '0 0 12px',
            }}
          >
            Jàngu Bi
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px' }}>
            Une erreur inattendue est survenue
          </h1>
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: '#94a3b8',
              margin: '0 0 24px',
            }}
          >
            Nos équipes ont été notifiées automatiquement. Vous pouvez réessayer
            ou revenir à l'accueil.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              appearance: 'none',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: '#70cbff',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: 15,
              padding: '12px 24px',
              borderRadius: 10,
            }}
          >
            Réessayer
          </button>
          {error.digest ? (
            <p style={{ fontSize: 12, color: '#64748b', margin: '20px 0 0' }}>
              Référence&nbsp;: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
