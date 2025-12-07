import type { Metadata } from 'next';
import './globals.css';
import { LazorProvider } from '@lazor-starter/core';

export const metadata: Metadata = {
  title: 'Lazor Starter - Universal Lazorkit SDK Starter',
  description: 'Production-ready Universal Monorepo Starter for Lazorkit SDK',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                if (typeof window !== 'undefined' && !window.global) { 
                  window.global = window; 
                }
              })();
            `,
          }}
        />
        <LazorProvider>
          {children}
        </LazorProvider>
      </body>
    </html>
  );
}
