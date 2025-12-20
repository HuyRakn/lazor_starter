'use client';

import { useMemo } from 'react';
import { useWallet as useLazorWalletSDK } from '@lazorkit/wallet';

/**
 * Wrapper hook cho LazorKit React SDK (web), dùng chung cho web & mobile.
 *
 * Mobile dựa vào polyfill (window, Buffer, WebSocket, v.v.) để dùng cùng SDK web,
 * tránh phải import trực tiếp adapter React Native trong core (từng gây lỗi cho web).
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


