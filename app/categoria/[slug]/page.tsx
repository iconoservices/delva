import React from 'react';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import CategoryClient from './CategoryClient';

interface Props {
  params: { slug: string };
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://delva.bogahub.app';

async function getCategoryData(slug: string) {
  try {
    // 1. Fetch categories setting to resolve category display name
    const { data: settings } = await supabase
      .from('settings')
      .select('categories')
      .eq('id', 'categories')
      .maybeSingle();

    const categoriesList: any[] = settings?.categories || [];
    const matchedCategory = categoriesList.find(
      (c) =>
        c.id?.toLowerCase() === slug.toLowerCase() ||
        c.slug?.toLowerCase() === slug.toLowerCase() ||
        c.name?.toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
    );

    const categoryName = matchedCategory?.name || decodeURIComponent(slug).replace(/-/g, ' ');

    // 2. Fetch up to 10 products for this category to include in structured data and rich snippets
    const { data: products } = await supabase
      .from('products')
      .select('id, name, image, price, slug, category, subcategory')
      .eq('store', 'delva')
      .neq('status', 'Inactivo')
      .limit(10);

    // Filter products matching category name or id
    const filteredProducts = (products || []).filter((p: any) => {
      const pCat = (p.category || '').toLowerCase();
      const pSub = (p.subcategory || '').toLowerCase();
      const target = categoryName.toLowerCase();
      const slugTarget = slug.toLowerCase();
      return pCat === target || pCat === slugTarget || pSub === target || pSub === slugTarget;
    });

    const displayProducts = filteredProducts.length > 0 ? filteredProducts : (products || []).slice(0, 5);

    return {
      categoryName,
      products: displayProducts,
    };
  } catch (error) {
    console.error('Error fetching category data:', error);
    return {
      categoryName: decodeURIComponent(slug).replace(/-/g, ' '),
      products: [],
    };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const { categoryName, products } = await getCategoryData(slug);
  const title = `${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} | DELVA`;
  const description = `Descubre los mejores productos de ${categoryName} en DELVA. De la selva central a tu casa con envíos a todo el Perú.`;
  const imageUrl = products[0]?.image || `${BASE_URL}/banner_1.jpg`;
  const canonicalUrl = `${BASE_URL}/categoria/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'DELVA | La tienda de la selva',
      images: [
        {
          url: imageUrl,
          alt: categoryName,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { categoryName, products } = await getCategoryData(params.slug);

  // Schema.org CollectionPage & ItemList with product thumbnails for Google Search Rich Snippet
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${categoryName} | DELVA`,
    description: `Catálogo de ${categoryName} en DELVA. Productos de la selva central.`,
    url: `${BASE_URL}/categoria/${params.slug}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: products.map((prod: any, idx: number) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Product',
          name: prod.name,
          image: prod.image,
          url: `${BASE_URL}/producto/${prod.slug || prod.id}`,
          offers: {
            '@type': 'Offer',
            priceCurrency: 'PEN',
            price: Number(prod.price || 0).toFixed(2),
            availability: 'https://schema.org/InStock',
          },
        },
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryClient />
    </>
  );
}
