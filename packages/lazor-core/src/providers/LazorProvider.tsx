'use client';

import React, { useEffect } from 'react';

type Props = {
  children: React.ReactNode;
  rpcUrl?: string;
  paymasterUrl?: string;
  ipfsUrl?: string;
};

/**
 * Universal provider wrapper for Lazorkit SDK
 *
 * Shared package component for monorepo (Web & Mobile).
 * Automatically configures RPC URL, Paymaster URL, and Portal URL from environment variables.
 * Falls back to devnet defaults if not provided.
 *
 * @param children - React children components
 * @param rpcUrl - Optional Solana RPC URL (overrides env)
 * @param paymasterUrl - Optional Paymaster URL for gasless transactions (overrides env)
 * @param ipfsUrl - Optional Portal/IPFS URL (overrides env)
 * @returns Provider component wrapping children
 */
export function LazorProvider({ children, rpcUrl, paymasterUrl, ipfsUrl }: Props) {
  const finalRpcUrl =
    rpcUrl ||
    (typeof window !== 'undefined'
      ? (window as any).process?.env?.NEXT_PUBLIC_LAZORKIT_RPC_URL
      : undefined) ||
    process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL ||
    process.env.LAZORKIT_RPC_URL ||
    'https://api.devnet.solana.com';

  if (finalRpcUrl && !finalRpcUrl.includes('devnet') && !finalRpcUrl.includes('localhost')) {
    console.warn(
      '⚠️ WARNING: RPC URL does not appear to be devnet. This starter is designed for devnet only.',
      { rpcUrl: finalRpcUrl }
    );
  }

  const finalPaymasterUrl =
    paymasterUrl ||
    (typeof window !== 'undefined'
      ? (window as any).process?.env?.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL
      : undefined) ||
    process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL ||
    process.env.LAZORKIT_PAYMASTER_URL ||
    'https://kora.devnet.lazorkit.com/';

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

  const finalApiKey =
    (typeof window !== 'undefined'
      ? (window as any).process?.env?.NEXT_PUBLIC_LAZORKIT_API_KEY
      : undefined) ||
    process.env.NEXT_PUBLIC_LAZORKIT_API_KEY ||
    process.env.LAZORKIT_API_KEY ||
    'kora_live_api_cfa755da42cf3026291a5069e74ff37f3514d06400059c4408a20738e334df1d';

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (finalRpcUrl && finalPaymasterUrl && finalIpfsUrl) {
      import('@lazorkit/wallet').then((module) => {
        const { useWalletStore } = module;
        const store = (useWalletStore as any).getState?.() || useWalletStore;
        if (store && typeof store.setConfig === 'function') {
          store.setConfig({
            rpcUrl: finalRpcUrl,
            paymasterConfig: {
              paymasterUrl: finalPaymasterUrl,
              apiKey: finalApiKey,
            },
            portalUrl: finalIpfsUrl,
          });
        }
      }).catch((error) => {
        console.warn('Failed to configure wallet store:', error);
      });
    }
  }, [finalRpcUrl, finalPaymasterUrl, finalIpfsUrl, finalApiKey]);

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

  return <>{children}</>;
}

export default LazorProvider;
