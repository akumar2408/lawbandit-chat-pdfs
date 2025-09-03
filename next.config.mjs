/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Let Next bundle these CJS libs in server contexts (route handlers)
    serverComponentsExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  },
};

export default nextConfig;
