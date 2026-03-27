import React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { AppProvider } from '@/lib/context/AppContext';
import Shell from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'DELVA | De la selva, su marketplace',
  description: 'Tu marketplace amazónico de confianza.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
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

