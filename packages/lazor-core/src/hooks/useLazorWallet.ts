'use client';

import { useMemo } from 'react';
import { useWallet as useLazorWalletSDK } from '@lazorkit/wallet';

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

