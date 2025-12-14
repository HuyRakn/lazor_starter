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
                
                // Suppress retry delay console logs
                const originalError = console.error;
                const originalWarn = console.warn;
                const originalLog = console.log;
                
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('Retrying after') || 
                      message.includes('delay') && message.includes('ms') ||
                      message.includes('Server responded with 429')) {
                    return;
                  }
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('Retrying after') || 
                      message.includes('delay') && message.includes('ms') ||
                      message.includes('Server responded with 429')) {
                    return;
                  }
                  originalWarn.apply(console, args);
                };
                
                console.log = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('Retrying after') || 
                      message.includes('delay') && message.includes('ms') ||
                      message.includes('Server responded with 429')) {
                    return;
                  }
                  originalLog.apply(console, args);
                };
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
