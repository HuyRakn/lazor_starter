import type { Metadata } from 'next';
import './globals.css';
import { WalletProviderWrapper } from '../components/WalletProviderWrapper';

export const metadata: Metadata = {
  title: 'Lazor Starter - Universal Lazorkit SDK Starter',
  description: 'Production-ready Universal Monorepo Starter for Lazorkit SDK',
  icons: {
    icon: '/images/lazorkit-logo.png',
    shortcut: '/images/lazorkit-logo.png',
    apple: '/images/lazorkit-logo.png',
  },
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
                // CRITICAL: Set global polyfill FIRST before any other code runs
                if (typeof window !== 'undefined') {
                  if (typeof window.global === 'undefined') {
                    window.global = window;
                  }
                  if (typeof globalThis !== 'undefined' && typeof globalThis.global === 'undefined') {
                    globalThis.global = globalThis;
                  }
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
        <WalletProviderWrapper>
          <main>{children}</main>
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
