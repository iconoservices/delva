import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://delva.bogahub.app';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin2', '/api', '/pos'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
