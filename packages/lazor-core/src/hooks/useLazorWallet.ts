'use client';

import { useMemo } from 'react';
import { useWallet as useLazorWalletSDK } from '@lazorkit/wallet';

/**
 * Wrapper hook for Lazorkit SDK wallet functionality
 *
 * Shared hook for monorepo (Web & Mobile).
 * Provides access to Lazorkit wallet methods with consistent API
 * across Web and Mobile platforms.
 *
 * @returns {Object} Lazorkit wallet SDK instance with additional helper methods
 * @returns {Function} returns.createPasskeyOnly - Create passkey without wallet
 * @returns {Function} returns.createSmartWalletOnly - Create wallet without passkey
 * @returns {Function} returns.createSmartWallet - Create both passkey and wallet
 * @returns {Function} returns.signAndSendTransaction - Sign and send transaction
 * @returns {Function} returns.connect - Connect wallet
 */
export function useLazorWallet(): any {
  const sdk = useLazorWalletSDK();

  return useMemo(() => {
    const createPasskeyOnly = (sdk as any)?.createPasskeyOnly;
    const createSmartWallet = (sdk as any)?.createSmartWallet;
    const createSmartWalletOnly = (sdk as any)?.createSmartWalletOnly;

    return {
      ...sdk,
      createPasskeyOnly,
      createSmartWalletOnly: createSmartWalletOnly || createSmartWallet,
      createSmartWallet,
    };
  }, [sdk]);
}

