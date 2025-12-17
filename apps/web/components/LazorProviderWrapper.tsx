'use client';

import { LazorProvider, useNetworkStore } from '@lazor-starter/core';

export function LazorProviderWrapper({ children }: { children: React.ReactNode }) {
  const network = useNetworkStore((state) => state.network);
  const isDevnet = network === 'devnet';

  return (
    <LazorProvider
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
    </LazorProvider>
  );
}

