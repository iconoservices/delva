import React from 'react';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: { slug: string };
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://delva.bogahub.app';

async function getProduct(slug: string) {
  try {
    const query = supabase
      .from('products')
      .select('id, name, image, description, price, originalPrice, stock, category, sku, gallery, slug')
      .eq('store', 'delva');
    
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let result;
    if (isUUID) {
      result = await query.or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle();
    } else {
      result = await query.eq('slug', slug).maybeSingle();
    }

    return result?.data || null;
  } catch (error) {
    console.error('Error fetching product for SEO:', error);
    return null;
  }
}

// 🤖 SERVER-SIDE SEO METADATA
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const product = await getProduct(slug);

  if (product) {
    const title = product.name || 'Producto';
    const description = product.description 
      ? product.description.slice(0, 160) 
      : `Compra ${title} en DELVA. Envíos y entregas de la selva central a todo el Perú.`;
    const image = product.image || `${BASE_URL}/banner_1.jpg`;
    const canonicalUrl = `${BASE_URL}/producto/${product.slug || slug}`;

    return {
      title: `${title} | DELVA`,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: `${title} - S/ ${Number(product.price || 0).toFixed(2)} | DELVA`,
        description,
        url: canonicalUrl,
        siteName: 'DELVA | La tienda de la selva',
        images: [
          {
            url: image,
            alt: title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} | DELVA`,
        description,
        images: [image],
      },
    };
  }

  return {
    title: 'Producto | DELVA',
    description: 'La tienda de la selva central del Perú.',
  };
}

export default async function Page({ params }: Props) {
  const product = await getProduct(params.slug);

  // Schema.org Structured Data (Google Rich Snippets / Google Shopping Product Card)
  let jsonLd = null;
  if (product) {
    const productUrl = `${BASE_URL}/producto/${product.slug || params.slug}`;
    const images: string[] = [];
    if (product.image) images.push(product.image);
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((img: string) => {
        if (img && !images.includes(img)) images.push(img);
      });
    }

    jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: images.length > 0 ? images : undefined,
      description: product.description || `Compra ${product.name} en DELVA.`,
      sku: product.sku || product.id,
      category: product.category || 'General',
      brand: {
        '@type': 'Brand',
        name: 'DELVA',
      },
      offers: {
        '@type': 'Offer',
        url: productUrl,
        priceCurrency: 'PEN',
        price: Number(product.price || 0).toFixed(2),
        priceValidUntil: '2027-12-31',
        itemCondition: 'https://schema.org/NewCondition',
        availability: (product.stock ?? 1) > 0 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'DELVA',
        },
      },
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductDetailClient slug={params.slug} />
    </>
  );
}
