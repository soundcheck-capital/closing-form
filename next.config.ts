import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  org: 'soundcheck-capital',
  project: 'stripe-form',
  silent: !process.env.CI,
});
