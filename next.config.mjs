import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['src/app', 'src/components', 'src/features', 'src/lib', 'src/stores', 'src/hooks', 'src/utils', 'src/config'],
  },
};

export default withSentryConfig(nextConfig, {
  org: 'isi-of',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
});
