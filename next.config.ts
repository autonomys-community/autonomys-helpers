/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: isProd ? '/autonomys-helpers' : '',
  assetPrefix: isProd ? '/autonomys-helpers/' : '',
  trailingSlash: true,
};

module.exports = nextConfig;
