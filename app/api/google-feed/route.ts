import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // Cache por 1 hora

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://delva.bogahub.app';

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
}

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('store', 'delva')
      .neq('status', 'Inactivo');

    if (error) {
      console.error('Error fetching products for Google feed:', error);
      return new NextResponse('Error generating feed', { status: 500 });
    }

    const itemsXml = (products || [])
      .map((p) => {
        const id = p.id;
        const title = escapeXml(p.name || 'Producto DELVA');
        const rawDesc = p.description || `${p.name || 'Producto'} disponible en DELVA. Envíos a todo el Perú.`;
        const description = escapeXml(rawDesc.slice(0, 5000));
        const slug = p.slug || p.id;
        const link = `${BASE_URL}/producto/${slug}`;
        
        let imageLink = p.image || '';
        if (imageLink && imageLink.startsWith('/')) {
          imageLink = `${BASE_URL}${imageLink}`;
        }

        const price = Number(p.price || 0).toFixed(2);
        const availability = (p.stock ?? 1) > 0 ? 'in_stock' : 'out_of_stock';
        const brand = 'DELVA';
        const category = escapeXml(p.category || 'General');

        return `
    <item>
      <g:id>${escapeXml(id)}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      ${imageLink ? `<g:image_link>${escapeXml(imageLink)}</g:image_link>` : ''}
      <g:availability>${availability}</g:availability>
      <g:price>${price} PEN</g:price>
      <g:brand>${brand}</g:brand>
      <g:condition>new</g:condition>
      <g:product_type>${category}</g:product_type>
    </item>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>DELVA - La tienda de la selva</title>
    <link>${BASE_URL}</link>
    <description>Catálogo oficial de productos de DELVA para Google Merchant Center y Google Shopping</description>
    ${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('Fatal error generating Google feed:', err);
    return new NextResponse('Internal error', { status: 500 });
  }
}
