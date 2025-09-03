/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Let Next bundle these CJS libs for server routes
    serverComponentsExternalPackages: ['pdf-parse', 'openai', 'pdfjs-dist'],
  },
};

export default nextConfig;
