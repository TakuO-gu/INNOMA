import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  transpilePackages: ['@innoma/transformer', '@innoma/ui-mapper'],
};

export default nextConfig;
