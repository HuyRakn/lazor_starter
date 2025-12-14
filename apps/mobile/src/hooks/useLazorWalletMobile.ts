/**
 * Mobile-specific wrapper for useLazorWallet
 * Overrides createPasskeyOnly to use native passkey API instead of portal
 */

import { useMemo } from 'react';
import { useWallet as useLazorWalletSDK } from '@lazorkit/wallet';
import { useMobilePasskey } from './useMobilePasskey';
import { Platform } from 'react-native';
import type { PasskeyData } from '@lazor-starter/core';

/**
 * Mobile-specific wallet hook that uses native passkey APIs
 * 
 * Automatically uses native biometric authentication on mobile devices
 * instead of the portal WebView flow.
 * 
 * @returns Lazorkit wallet SDK instance with mobile-native passkey support
 * @returns {Function} createPasskeyOnly - Create passkey using native Face ID / Touch ID
 * @returns {Function} createSmartWallet - Create smart wallet
 * @returns {Function} connectPasskey - Alias for createPasskeyOnly
 */
export function useLazorWalletMobile(): any {
  const sdk = useLazorWalletSDK();
  const { createPasskey, isAvailable } = useMobilePasskey();

  return useMemo(() => {
    const createSmartWallet = (sdk as any)?.createSmartWallet;
    const createSmartWalletOnly = (sdk as any)?.createSmartWalletOnly;

    // Override createPasskeyOnly for mobile to use native API
    const createPasskeyOnly = async (): Promise<PasskeyData> => {
      console.log('📱 Using mobile native passkey API');
      
      // Check if we're on mobile
      if (Platform.OS === 'web') {
        // Fallback to SDK's implementation on web
        const originalCreatePasskeyOnly = (sdk as any)?.createPasskeyOnly;
        if (originalCreatePasskeyOnly) {
          return originalCreatePasskeyOnly();
        }
        throw new Error('createPasskeyOnly not available');
      }

      // Use native passkey API on mobile
      try {
        const passkeyData = await createPasskey();
        return passkeyData;
      } catch (error: any) {
        console.error('Native passkey creation failed, falling back to portal:', error);
        
        // Fallback to portal if native API fails
        const originalCreatePasskeyOnly = (sdk as any)?.createPasskeyOnly;
        if (originalCreatePasskeyOnly) {
          return originalCreatePasskeyOnly();
        }
        throw error;
      }
    };

    return {
      ...sdk,
      createPasskeyOnly,
      createSmartWalletOnly: createSmartWalletOnly || createSmartWallet,
      connectPasskey: createPasskeyOnly,
      createSmartWallet,
    };
  }, [sdk, createPasskey]);
}

