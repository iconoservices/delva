import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://delva.bogahub.app';

export const metadata: Metadata = {
  title: 'Catálogo de Productos | DELVA - La tienda de la selva',
  description: 'Explora todos los productos de la selva central del Perú en DELVA: artesanías, café premium, moda y más. Envíos directos a todo el país.',
  alternates: {
    canonical: `${BASE_URL}/tienda`,
  },
  openGraph: {
    title: 'Catálogo de Productos | DELVA',
    description: 'Explora todos los productos de la selva central del Perú en DELVA.',
    url: `${BASE_URL}/tienda`,
    siteName: 'DELVA | La tienda de la selva',
    type: 'website',
  },
};

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
