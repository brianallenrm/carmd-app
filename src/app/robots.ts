import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/os/',
        '/os/*',
        '/admin/',
        '/inventario/',
        '/catalog/',
        '/note-preview/',
        '/login',
        '/api/'
      ],
    },
    sitemap: 'https://carmd.com.mx/sitemap.xml',
  };
}
