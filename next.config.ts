import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@sparticuz/chromium'],
  async redirects() {
    return [
      {
        source: '/sobre-nosotros',
        destination: '/web-test/nosotros',
        permanent: true,
      },
      {
        source: '/servicios',
        destination: '/web-test/servicios',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
