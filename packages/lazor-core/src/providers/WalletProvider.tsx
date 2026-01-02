'use client';

import React from 'react';
import { useNetworkStore, type Network } from '../state/networkStore';
import { LazorkitProvider } from '@lazorkit/wallet';

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

  // Use props directly - WalletProviderWrapper should pass all required values
  // Don't fallback to process.env here as it may not be available in shared packages
  const finalRpcUrl = rpcUrl || '';
  const finalPaymasterUrl = paymasterUrl || undefined;
  const finalIpfsUrl = ipfsUrl || undefined;
  const finalApiKey = apiKey !== undefined ? apiKey : (isDevnet ? '' : '');

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

  // Wrap with LazorkitProvider from @lazorkit/wallet (direct import, no dynamic loading)
  return (
    <LazorkitProvider
      rpcUrl={finalRpcUrl}
      portalUrl={finalIpfsUrl}
      paymasterConfig={{
        paymasterUrl: finalPaymasterUrl,
        apiKey: finalApiKey,
      }}
    >
      {children}
    </LazorkitProvider>
  );
}

export default WalletProvider;

