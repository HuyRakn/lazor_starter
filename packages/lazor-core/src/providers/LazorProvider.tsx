'use client';

import React from 'react';
import { LazorkitProvider } from '@lazorkit/wallet';

type Props = {
  children: React.ReactNode;
  rpcUrl?: string;
  paymasterUrl?: string;
  ipfsUrl?: string;
};

export function LazorProvider({ children, rpcUrl, paymasterUrl, ipfsUrl }: Props) {
  // Read env from environment variables (works for both Web and Mobile)
  // For Next.js, process.env.NEXT_PUBLIC_* is available
  // For Expo, we need to use Constants.expoConfig.extra or process.env
  // CRITICAL: Always use devnet RPC for this starter
  // This ensures 100% onchain devnet, no mocks
  const finalRpcUrl =
    rpcUrl ||
    (typeof window !== 'undefined'
      ? (window as any).process?.env?.NEXT_PUBLIC_LAZORKIT_RPC_URL
      : undefined) ||
    process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL ||
    process.env.LAZORKIT_RPC_URL ||
    'https://api.devnet.solana.com'; // Default to devnet

  // Validate RPC URL is devnet (safety check)
  if (finalRpcUrl && !finalRpcUrl.includes('devnet') && !finalRpcUrl.includes('localhost')) {
    console.warn(
      '⚠️ WARNING: RPC URL does not appear to be devnet. This starter is designed for devnet only.',
      { rpcUrl: finalRpcUrl }
    );
  }

  // CRITICAL: Always use devnet Paymaster for gasless transactions
  // This ensures 100% onchain devnet, no mocks
  const finalPaymasterUrl =
    paymasterUrl ||
    (typeof window !== 'undefined'
      ? (window as any).process?.env?.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL
      : undefined) ||
    process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL ||
    process.env.LAZORKIT_PAYMASTER_URL ||
    'https://kora.devnet.lazorkit.com/'; // Default to devnet paymaster

  // Validate Paymaster URL is devnet (safety check)
  if (finalPaymasterUrl && !finalPaymasterUrl.includes('devnet') && !finalPaymasterUrl.includes('localhost')) {
    console.warn(
      '⚠️ WARNING: Paymaster URL does not appear to be devnet. This starter is designed for devnet only.',
      { paymasterUrl: finalPaymasterUrl }
    );
  }

  const finalIpfsUrl =
    ipfsUrl ||
    (typeof window !== 'undefined'
      ? (window as any).process?.env?.NEXT_PUBLIC_LAZORKIT_PORTAL_URL
      : undefined) ||
    process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL ||
    process.env.LAZORKIT_PORTAL_URL ||
    'https://portal.lazor.sh';

  // If envs are missing, still render children to avoid blocking the app
  if (!finalRpcUrl || !finalPaymasterUrl || !finalIpfsUrl) {
    console.warn(
      'LazorProvider: Missing required environment variables. Some features may not work.',
      {
        rpcUrl: finalRpcUrl,
        paymasterUrl: finalPaymasterUrl,
        ipfsUrl: finalIpfsUrl,
      }
    );
    return <>{children}</>;
  }

  return (
    <LazorkitProvider
      rpcUrl={finalRpcUrl}
      paymasterUrl={finalPaymasterUrl}
      portalUrl={finalIpfsUrl}
    >
      {children}
    </LazorkitProvider>
  );
}

export default LazorProvider;
