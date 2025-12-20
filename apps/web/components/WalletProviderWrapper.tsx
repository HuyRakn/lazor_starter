'use client';

import { WalletProvider, useNetworkStore } from '@lazor-starter/core';

// Lazorkit React SDK polyfills – required on web
// Docs: https://portal.lazor.sh/docs/react/getting-started#polyfills--configuration
// "if (typeof window !== 'undefined') { window.Buffer = window.Buffer || require('buffer').Buffer; }"
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Buffer } = require('buffer');

  // Match SDK docs exactly for window
  (window as any).Buffer = (window as any).Buffer || Buffer;

  // Also expose Buffer on globalThis / global for any SDK internals
  if (typeof globalThis !== 'undefined') {
    (globalThis as any).Buffer = (globalThis as any).Buffer || Buffer;
  }

  // Some bundles still read from global.Buffer in browser
  if (typeof global !== 'undefined') {
    (global as any).Buffer = (global as any).Buffer || Buffer;
  }
}

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

  return (
    <WalletProvider
      rpcUrl={
        isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET
          : process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL
      }
      paymasterUrl={
        isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET
          : process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL
      }
      ipfsUrl={
        isDevnet
          ? process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET
          : process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL
      }
      apiKey={isDevnet ? '' : process.env.NEXT_PUBLIC_LAZORKIT_API_KEY}
      network={network}
    >
      {children}
    </WalletProvider>
  );
}

