/**
 * Mobile-specific authentication hook using @lazorkit/wallet-mobile-adapter
 * 
 * Follows React Native SDK docs exactly:
 * - connect({ redirectUrl }) - required redirectUrl for deep linking
 * - Uses LazorKitProvider from @lazorkit/wallet-mobile-adapter
 */

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import Constants from 'expo-constants';
import { useNetworkStore } from '@lazor-starter/core';
import { getStorage } from '@lazor-starter/core';
import type { PasskeyData, WalletState } from '@lazor-starter/core';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  PASSKEY_DATA: 'lazorkit-passkey-data',
  WALLET_ADDRESS_MAINNET: 'lazorkit-wallet-address-mainnet',
  WALLET_ADDRESS_DEVNET: 'lazorkit-wallet-address-devnet',
  SMART_WALLET_ID_MAINNET: 'lazorkit-smart-wallet-id-mainnet',
  SMART_WALLET_ID_DEVNET: 'lazorkit-smart-wallet-id-devnet',
  HAS_PASSKEY: 'lazorkit-has-passkey',
  HAS_WALLET_MAINNET: 'lazorkit-has-wallet-mainnet',
  HAS_WALLET_DEVNET: 'lazorkit-has-wallet-devnet',
};

/**
 * Get redirect URL from app scheme
 */
function getRedirectUrl(): string {
  const scheme = Constants.expoConfig?.scheme || 'lazor-starter';
  return `${scheme}://home`;
}

/**
 * Get API Base URL
 */
const getApiBaseUrl = () => {
  const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl ||
    Constants.manifest?.extra?.apiBaseUrl;

  if (configuredUrl) return configuredUrl;

  if (__DEV__) {
    if (Constants.expoConfig?.hostUri) {
      const host = Constants.expoConfig.hostUri.split(':')[0];
      return `http://${host}:3000`;
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3000';
    }
  }
  return 'http://localhost:3000';
};

/**
 * Mobile authentication hook using React Native SDK
 * 
 * Provides the same API as useAuth but uses @lazorkit/wallet-mobile-adapter
 * with proper redirectUrl handling for deep linking.
 */
export function useMobileAuth() {
  const walletHook = useWallet();
  const { connect, disconnect, isConnected } = walletHook;
  const wallet = (walletHook as any).wallet as { smartWallet?: string; credentialId?: string; } | undefined;
  const network = useNetworkStore((state) => state.network);
  const [state, setState] = useState<WalletState>({
    hasPasskey: false,
    hasWallet: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state from storage
  useEffect(() => {
    const initState = async () => {
      const storage = getStorage();
      if (!storage) {
        setIsInitialized(true);
        return;
      }

      try {
        const hasPasskeyString = await Promise.resolve(storage.getItem(STORAGE_KEYS.HAS_PASSKEY));
        const walletAddressKey = network === 'devnet' ? STORAGE_KEYS.WALLET_ADDRESS_DEVNET : STORAGE_KEYS.WALLET_ADDRESS_MAINNET;
        const hasWalletKey = network === 'devnet' ? STORAGE_KEYS.HAS_WALLET_DEVNET : STORAGE_KEYS.HAS_WALLET_MAINNET;
        const smartWalletIdKey = network === 'devnet' ? STORAGE_KEYS.SMART_WALLET_ID_DEVNET : STORAGE_KEYS.SMART_WALLET_ID_MAINNET;

        const hasWalletString = await Promise.resolve(storage.getItem(hasWalletKey));
        const pubkey = await Promise.resolve(storage.getItem(walletAddressKey)) || undefined;
        const smartWalletIdString = await Promise.resolve(storage.getItem(smartWalletIdKey)) || undefined;
        const passkeyDataString = await Promise.resolve(storage.getItem(STORAGE_KEYS.PASSKEY_DATA));

        const hasPasskey = hasPasskeyString === 'true';
        const hasWallet = hasWalletString === 'true';
        let passkeyData: PasskeyData | undefined;

        if (passkeyDataString) {
          try {
            passkeyData = JSON.parse(passkeyDataString);
            if (smartWalletIdString && passkeyData) {
              (passkeyData as any).smartWalletId = smartWalletIdString;
              (passkeyData as any).walletId = smartWalletIdString;
              (passkeyData as any).smartWalletID = smartWalletIdString;
            }
          } catch (error) {
            // Ignore parse errors
          }
        }

        setState({ hasPasskey, hasWallet, pubkey, passkeyData });
      } catch (error) {
        // Ignore initialization errors
      } finally {
        setIsInitialized(true);
      }
    };

    initState();
  }, [network]);

  // Sync with wallet connection state
  useEffect(() => {
    if (isConnected && wallet?.smartWallet) {
      const currentPubkey = state.pubkey;
      if (currentPubkey !== wallet.smartWallet) {
        // Wallet connected but state not synced
        const passkeyData: PasskeyData = {
          credentialId: wallet.credentialId || '',
          userId: 'mobile',
          publicKey: {
            x: '',
            y: '',
          },
          smartWalletAddress: wallet.smartWallet,
          smartWalletId: wallet.smartWallet,
        };

        const newState: WalletState = {
          hasPasskey: true,
          hasWallet: true,
          pubkey: wallet.smartWallet,
          passkeyData,
        };

        setState(newState);
        saveToStorage(newState);
      }
    }
  }, [isConnected, wallet, state.pubkey]);

  /**
   * Save wallet state to storage
   */
  const saveToStorage = useCallback(
    async (newState: Partial<WalletState>) => {
      const storage = getStorage();
      if (!storage) return;

      const walletAddressKey = network === 'devnet' ? STORAGE_KEYS.WALLET_ADDRESS_DEVNET : STORAGE_KEYS.WALLET_ADDRESS_MAINNET;
      const hasWalletKey = network === 'devnet' ? STORAGE_KEYS.HAS_WALLET_DEVNET : STORAGE_KEYS.HAS_WALLET_MAINNET;
      const smartWalletIdKey = network === 'devnet' ? STORAGE_KEYS.SMART_WALLET_ID_DEVNET : STORAGE_KEYS.SMART_WALLET_ID_MAINNET;

      try {
        if (newState.hasPasskey !== undefined) {
          await Promise.resolve(storage.setItem(STORAGE_KEYS.HAS_PASSKEY, String(newState.hasPasskey)));
        }
        if (newState.hasWallet !== undefined) {
          await Promise.resolve(storage.setItem(hasWalletKey, String(newState.hasWallet)));
        }
        if (newState.pubkey !== undefined) {
          if (newState.pubkey) {
            await Promise.resolve(storage.setItem(walletAddressKey, newState.pubkey));
          } else {
            await Promise.resolve(storage.removeItem(walletAddressKey));
          }
        }
        const passkeyDataTyped = newState.passkeyData as any;
        if (passkeyDataTyped?.smartWalletId || passkeyDataTyped?.walletId || passkeyDataTyped?.smartWalletID) {
          const smartWalletId = passkeyDataTyped.smartWalletId || passkeyDataTyped.walletId || passkeyDataTyped.smartWalletID;
          await Promise.resolve(storage.setItem(smartWalletIdKey, String(smartWalletId)));
        }
        if (newState.passkeyData !== undefined) {
          if (newState.passkeyData) {
            await Promise.resolve(
              storage.setItem(
                STORAGE_KEYS.PASSKEY_DATA,
                JSON.stringify(newState.passkeyData)
              )
            );
            const smartWalletId = (newState.passkeyData as any)?.smartWalletId ||
              (newState.passkeyData as any)?.walletId ||
              (newState.passkeyData as any)?.smartWalletID;
            if (smartWalletId) {
              await Promise.resolve(storage.setItem(smartWalletIdKey, String(smartWalletId)));
            } else {
              await Promise.resolve(storage.removeItem(smartWalletIdKey));
            }
          } else {
            await Promise.resolve(storage.removeItem(STORAGE_KEYS.PASSKEY_DATA));
            await Promise.resolve(storage.removeItem(smartWalletIdKey));
          }
        }
      } catch (error) {
        // Ignore storage errors
      }
    },
    [network]
  );

  /**
   * Login with passkey using mobile adapter
   * 
   * Uses connect({ redirectUrl }) as per React Native SDK docs
   */
  const loginWithPasskey = useCallback(async (): Promise<PasskeyData> => {
    try {
      const redirectUrl = getRedirectUrl();

      // Connect using mobile adapter with redirectUrl
      const connectedWallet = await connect({
        redirectUrl,
        onSuccess: (wallet) => {
          console.log('✅ Mobile wallet connected:', wallet.smartWallet);
        },
        onFail: (error) => {
          console.error('❌ Mobile wallet connection failed:', error);
        },
      });

      if (!connectedWallet?.smartWallet) {
        throw new Error('Passkey login failed: missing smart wallet address');
      }

      const passkeyData: PasskeyData = {
        credentialId: connectedWallet.credentialId || '',
        userId: 'mobile',
        publicKey: {
          x: '',
          y: '',
        },
        smartWalletAddress: connectedWallet.smartWallet,
        smartWalletId: connectedWallet.smartWallet,
      };

      const newState: WalletState = {
        hasPasskey: true,
        hasWallet: true,
        pubkey: connectedWallet.smartWallet,
        passkeyData,
      };

      setState(newState);
      await saveToStorage(newState);

      return passkeyData;
    } catch (error) {
      throw error;
    }
  }, [connect, saveToStorage]);

  /**
   * Create smart wallet on-chain
   */
  const createSmartWallet = useCallback(
    async (passkeyData: PasskeyData): Promise<string> => {
      try {
        const currentNetwork = useNetworkStore.getState().network;
        const storage = getStorage();
        let storedWalletId: string | null = null;
        if (storage) {
          try {
            const smartWalletIdKey = currentNetwork === 'devnet' ? STORAGE_KEYS.SMART_WALLET_ID_DEVNET : STORAGE_KEYS.SMART_WALLET_ID_MAINNET;
            storedWalletId = await Promise.resolve(storage.getItem(smartWalletIdKey)) || null;
          } catch (error) {
            // Ignore storage read errors
          }
        }

        const passkeyDataTyped = passkeyData as any;
        const enrichedPasskeyData = storedWalletId
          ? {
            ...passkeyData,
            smartWalletId: storedWalletId,
            walletId: storedWalletId,
            smartWalletID: storedWalletId,
          }
          : passkeyData;

        const apiBase = (global as any).__LAZOR_MOBILE_API_BASE__ || getApiBaseUrl();
        const apiUrl = `${apiBase}/api/orders/create-smart-wallet`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            passkeyData: enrichedPasskeyData,
            network: currentNetwork === 'devnet' ? 'devnet' : 'mainnet',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({} as any));
          throw new Error(errorData?.error || 'Failed to create smart wallet');
        }

        const data = await response.json();
        const walletAddress = data?.walletAddress;
        const smartWalletIdFromApi = data?.smartWalletId;
        const smartWalletId = smartWalletIdFromApi || storedWalletId || (enrichedPasskeyData as any)?.smartWalletId;

        if (!walletAddress) {
          throw new Error('No wallet address returned');
        }

        const finalPasskeyData = {
          ...enrichedPasskeyData,
          smartWalletId: smartWalletId || (enrichedPasskeyData as any)?.smartWalletId,
          walletId: smartWalletId || (enrichedPasskeyData as any)?.smartWalletId,
          smartWalletID: smartWalletId || (enrichedPasskeyData as any)?.smartWalletId,
        } as any as PasskeyData;

        const newState: WalletState = {
          hasPasskey: true,
          hasWallet: true,
          pubkey: walletAddress,
          passkeyData: finalPasskeyData,
        };

        setState(newState);
        await saveToStorage(newState);

        return walletAddress;
      } catch (error) {
        throw error;
      }
    },
    [saveToStorage]
  );

  /**
   * Register new wallet (passkey + smart wallet)
   */
  const registerNewWallet = useCallback(async (): Promise<{
    passkeyData: PasskeyData;
    walletAddress: string;
  }> => {
    const passkeyData = await loginWithPasskey();
    const walletAddress = await createSmartWallet(passkeyData);
    return { passkeyData, walletAddress };
  }, [loginWithPasskey, createSmartWallet]);

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    if (disconnect && typeof disconnect === 'function') {
      try {
        await disconnect({
          onSuccess: () => {
            console.log('✅ Mobile wallet disconnected');
          },
          onFail: (e) => {
            console.error('❌ Mobile wallet disconnect failed:', e);
          },
        });
      } catch (error) {
        // Ignore disconnect errors
      }
    }

    const storage = getStorage();
    if (storage) {
      try {
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.PASSKEY_DATA));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.WALLET_ADDRESS_MAINNET));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.WALLET_ADDRESS_DEVNET));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.SMART_WALLET_ID_MAINNET));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.SMART_WALLET_ID_DEVNET));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.HAS_PASSKEY));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.HAS_WALLET_MAINNET));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.HAS_WALLET_DEVNET));
      } catch (error) {
        // Ignore storage errors
      }
    }

    setState({
      hasPasskey: false,
      hasWallet: false,
      pubkey: undefined,
      passkeyData: undefined,
    });
  }, [disconnect]);

  return {
    isLoggedIn: state.hasPasskey && state.hasWallet,
    hasPasskey: state.hasPasskey,
    hasWallet: state.hasWallet,
    pubkey: state.pubkey,
    passkeyData: state.passkeyData,
    isInitialized,
    loginWithPasskey,
    createSmartWallet,
    registerNewWallet,
    logout,
  };
}

