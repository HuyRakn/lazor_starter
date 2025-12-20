'use client';

import { useMemo } from 'react';
import { useWallet as useLazorkitWalletSDK } from '@lazorkit/wallet';

/**
 * Wrapper hook for Lazorkit React SDK (web), shared for web & mobile
 *
 * Mobile uses polyfills (window, Buffer, WebSocket, etc.) to use the same web SDK,
 * avoiding direct import of React Native adapter in core (which previously caused web errors).
 *
 * @returns {Object} Wallet SDK instance with additional methods
 * @returns {Function} returns.createPasskeyOnly - Create passkey without wallet
 * @returns {Function} returns.createSmartWalletOnly - Create wallet without passkey
 * @returns {Function} returns.createSmartWallet - Create both passkey and wallet
 * @returns {Function} returns.connect - Connect wallet
 * @returns {Function} returns.disconnect - Disconnect wallet
 * @returns {Function} returns.signAndSendTransaction - Sign and send transaction
 */
export function useWallet() {
  const sdk = useLazorkitWalletSDK();

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

