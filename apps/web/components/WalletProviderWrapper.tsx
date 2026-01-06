'use client';

// CRITICAL: Polyfills must be set BEFORE any imports that use them
// Set global polyfills first
if (typeof window !== 'undefined') {
  // Polyfill global for browser (required by @lazorkit/wallet)
  if (typeof (window as any).global === 'undefined') {
    (window as any).global = window;
  }
  
  // Also set on globalThis
  if (typeof globalThis !== 'undefined' && typeof (globalThis as any).global === 'undefined') {
    (globalThis as any).global = globalThis;
  }

// Lazorkit React SDK polyfills – required on web
// Docs: https://portal.lazor.sh/docs/react/getting-started#polyfills--configuration
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Buffer } = require('buffer');

  // Match SDK docs exactly for window
  (window as any).Buffer = (window as any).Buffer || Buffer;

  // Also expose Buffer on globalThis / global for any SDK internals
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;
  }

  // Some bundles still read from global.Buffer in browser
  if (typeof (window as any).global !== 'undefined') {
    ((window as any).global as any).Buffer = ((window as any).global as any).Buffer || Buffer;
  }
}

import { WalletProvider, useNetworkStore } from '@lazor-starter/core';

/**
 * Wrapper component for WalletProvider with environment configuration
 *
 * Automatically configures WalletProvider with environment variables
 * based on the selected network (mainnet/devnet).
 *
 * @param children - React children components
 * @returns WalletProvider component with configured props
 */
export function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
  const network = useNetworkStore((state) => state.network);
  const isDevnet = network === 'devnet';

  // Get env vars - Next.js injects NEXT_PUBLIC_* vars at build time
  const rpcUrl = isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET
    : process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL;
  
  const paymasterUrl = isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET
    : process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL;
  
  const portalUrl = isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET
    : process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL;
  
  const apiKey = isDevnet ? '' : process.env.NEXT_PUBLIC_LAZORKIT_API_KEY;

  // Log for debugging
  if (typeof window !== 'undefined' && (!rpcUrl || !paymasterUrl || !portalUrl)) {
    console.warn('WalletProviderWrapper: Missing env vars', {
      rpcUrl: !!rpcUrl,
      paymasterUrl: !!paymasterUrl,
      portalUrl: !!portalUrl,
      isDevnet,
    });
  }

  return (
    <WalletProvider
      rpcUrl={rpcUrl}
      paymasterUrl={paymasterUrl}
      ipfsUrl={portalUrl}
      apiKey={apiKey}
      network={network}
    >
      {children}
    </WalletProvider>
  );
}

