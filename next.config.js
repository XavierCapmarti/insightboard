/** @type {import('next').NextConfig} */
const isProduction = process.env.NODE_ENV === 'production';
const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const isStaticExport = isProduction || isGitHubPages;

const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport ? {
    output: 'export',
    basePath: '/insightboard',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
    // Exclude API routes from static export (they don't work in static sites)
    pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  } : {}),
};

module.exports = nextConfig;

