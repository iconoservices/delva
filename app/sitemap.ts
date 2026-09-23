import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://delva.bogahub.app';

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tienda`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Dynamic products and categories from Supabase
  try {
    const [productsRes, categoriesRes] = await Promise.all([
      supabase
        .from('products')
        .select('slug, id, category, updated_at')
        .eq('store', 'delva')
        .neq('status', 'Inactivo'),
      supabase
        .from('settings')
        .select('categories')
        .eq('id', 'categories')
        .maybeSingle()
    ]);

    // Categories
    const categories = categoriesRes?.data?.categories;
    if (Array.isArray(categories)) {
      categories.forEach((cat: any) => {
        const catSlug = cat.id || cat.slug || cat.name?.toLowerCase().replace(/\s+/g, '-');
        if (catSlug && catSlug !== 'all') {
          routes.push({
            url: `${baseUrl}/categoria/${catSlug}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
          });
        }
      });
    }

    // Products
    if (productsRes?.data) {
      productsRes.data.forEach((p: any) => {
        const productSlug = p.slug || p.id;
        if (productSlug) {
          routes.push({
            url: `${baseUrl}/producto/${productSlug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.85,
          });
        }
      });
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
