'use client';

import React, { useEffect } from 'react';
import { useNetworkStore, type Network } from '../state/networkStore';

type Props = {
  children: React.ReactNode;
  rpcUrl?: string;
  paymasterUrl?: string;
  ipfsUrl?: string;
  apiKey?: string;
  network?: Network;
};

/**
 * Universal provider wrapper for Lazorkit SDK
 *
 * Shared package component for monorepo (Web & Mobile).
 * Automatically configures RPC URL, Paymaster URL, and Portal URL from environment variables.
 * Supports switching between mainnet and devnet.
 *
 * @param children - React children components
 * @param rpcUrl - Optional Solana RPC URL (overrides env)
 * @param paymasterUrl - Optional Paymaster URL for gasless transactions (overrides env)
 * @param ipfsUrl - Optional Portal/IPFS URL (overrides env)
 * @param apiKey - Optional Paymaster API key (only required for mainnet)
 * @param network - Optional network override (mainnet/devnet), defaults to store value
 * @returns Provider component wrapping children
 */
export function WalletProvider({ children, rpcUrl, paymasterUrl, ipfsUrl, apiKey, network: networkProp }: Props) {
  const networkStore = useNetworkStore();
  const network = networkProp || networkStore.network;
  const isDevnet = network === 'devnet';

  const finalRpcUrl =
    rpcUrl ||
    (isDevnet
      ? process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET
      : process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL) ||
    '';

  const finalPaymasterUrl =
    paymasterUrl ||
    (isDevnet
      ? process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET
      : process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL) ||
    undefined;

  const finalIpfsUrl =
    ipfsUrl ||
    (isDevnet
      ? process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL_DEVNET
      : process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL) ||
    undefined;

  const finalApiKey =
    apiKey !== undefined
      ? apiKey
      : isDevnet
        ? ''
        : process.env.NEXT_PUBLIC_LAZORKIT_API_KEY || '';

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
      'WalletProvider: Missing required environment variables. Some features may not work.',
      {
        rpcUrl: finalRpcUrl,
        paymasterUrl: finalPaymasterUrl,
        ipfsUrl: finalIpfsUrl,
      }
    );
    return <>{children}</>;
  }

  if (!isDevnet && !finalApiKey) {
    console.warn('WalletProvider: Paymaster API key is missing. Gasless may fail.');
  }

  return <>{children}</>;
}

export default WalletProvider;

