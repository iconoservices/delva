import React from 'react';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import ProductDetailClient from './ProductDetailClient';

interface Props {
  params: { slug: string };
}

// 🤖 SERVER-SIDE SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  
  try {
    const query = supabase.from('products').select('name, image, description').eq('store', 'delva');
    
    // Evitar errores de casteo de UUID si el slug no tiene formato UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    let result;
    if (isUUID) {
      result = await query.or(`slug.eq.${slug},id.eq.${slug}`).maybeSingle();
    } else {
      result = await query.eq('slug', slug).maybeSingle();
    }

    const product = result?.data;

    if (product) {
        const title = product.name || 'Producto';
        const image = product.image || '';
        const description = product.description || 'Tu marketplace amazónico.';

        return {
            title: `${title} | DELVA`,
            description,
            openGraph: {
                title: `${title} | DELVA`,
                description,
                images: [image],
            },
        };
    }
  } catch (error) {
    console.error("Error fetching metadata:", error);
  }

  return {
    title: 'Producto | DELVA',
    description: 'De la selva, su marketplace.',
  };
}

export default function Page({ params }: Props) {
  return <ProductDetailClient slug={params.slug} />;
}
