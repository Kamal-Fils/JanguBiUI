import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
};

export default withSentryConfig(nextConfig, {
  // Aligné sur le projet du DSN runtime (NEXT_PUBLIC_SENTRY_DSN →
  // o4511339788042240 / 4511498298327120 = kamalfils-m6/jangubi-dev). Les
  // source-maps doivent monter dans le MÊME projet que celui où les events
  // sont ingérés, sinon les stack traces ne sont jamais symbolisées.
  org: 'kamalfils-m6',
  project: 'jangubi-dev',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  tunnelRoute: '/monitoring',
});
