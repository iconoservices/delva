import React from 'react';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Outfit, Montserrat } from 'next/font/google';
import { AppProvider } from '@/lib/context/AppContext';
import Shell from '@/components/layout/Shell';

const outfit = Outfit({ subsets: ['latin'], variable: '--f-outfit', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--f-montserrat', display: 'swap' });

export const viewport: Viewport = {
  themeColor: '#033737',
};

export const metadata: Metadata = {
  title: 'DELVA | La tienda de la selva',
  description: 'Tu tienda amazónica de confianza.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon-64.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'DELVA',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${outfit.variable} ${montserrat.variable}`}>
      <body>
        <AppProvider>
          <Shell>
            {children}
          </Shell>
        </AppProvider>
      </body>
    </html>
  );
}

