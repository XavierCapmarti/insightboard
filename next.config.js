/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

const nextConfig = {
  reactStrictMode: true,
  ...(isProduction || isGitHubPages ? {
    output: 'export',
    basePath: '/insightboard',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  } : {}),
};

module.exports = nextConfig;

