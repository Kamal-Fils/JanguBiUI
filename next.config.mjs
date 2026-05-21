/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Only lint app source directories during production build — test files
    // are covered by the dedicated vitest run, not the Next.js build step.
    dirs: ['src/app', 'src/components', 'src/features', 'src/lib', 'src/stores', 'src/hooks', 'src/utils', 'src/config'],
  },
};

export default nextConfig;
