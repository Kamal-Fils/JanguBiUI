import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  org: 'isi-of',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
});
