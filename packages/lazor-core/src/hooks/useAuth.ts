'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWallet } from './useWallet';
import type { PasskeyData, WalletState } from '../types';
import { getStorage } from '../utils/storage';
import { useNetworkStore } from '../state/networkStore';

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
 * Main authentication hook for Lazorkit Passkey and Smart Wallet
 *
 * Shared hook for monorepo (Web & Mobile).
 * Handles passkey creation, smart wallet registration, login, and logout.
 * Automatically persists session state across page reloads.
 *
 * @returns {Object} Authentication state and methods
 * @returns {boolean} returns.isLoggedIn - True if user has both passkey and wallet
 * @returns {boolean} returns.hasPasskey - True if passkey exists
 * @returns {boolean} returns.hasWallet - True if smart wallet is created
 * @returns {string|undefined} returns.pubkey - Wallet public key address
 * @returns {PasskeyData|undefined} returns.passkeyData - Passkey credential data
 * @returns {boolean} returns.isInitialized - True when initial state is loaded
 * @returns {() => Promise<PasskeyData>} returns.loginWithPasskey - Create/authenticate with passkey
 * @returns {(passkeyData: PasskeyData) => Promise<string>} returns.createSmartWallet - Create smart wallet from passkey
 * @returns {() => Promise<{passkeyData: PasskeyData, walletAddress: string}>} returns.registerNewWallet - Register new wallet (passkey + smart wallet)
 * @returns {() => Promise<void>} returns.logout - Clear session and logout
 */
export function useAuth() {
  const wallet = useWallet();
  const network = useNetworkStore((state) => state.network);
  const [state, setState] = useState<WalletState>({
    hasPasskey: false,
    hasWallet: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initializes authentication state from persistent storage
   *
   * Loads passkey data, wallet address, and authentication state
   * from localStorage (Web) or AsyncStorage (Mobile).
   *
   * @returns Promise that resolves when initialization is complete
   */
  const initializeAuthState = useCallback(async (): Promise<void> => {
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
  }, [network]);

  useEffect(() => {
    initializeAuthState();
  }, [initializeAuthState]);

  /**
   * Reconnects wallet if passkey data exists but wallet is not connected
   *
   * Automatically attempts to reconnect the wallet when passkey data
   * is available but the wallet connection is lost.
   *
   * @returns Promise that resolves when reconnection attempt completes
   */
  const reconnectWallet = useCallback(async (): Promise<void> => {
    if (!state.passkeyData) {
      return;
    }

    if (!(wallet as any)?.isConnected && !wallet?.signAndSendTransaction) {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (wallet?.connect && typeof wallet.connect === 'function') {
          await wallet.connect({ feeMode: 'paymaster' });
        }
      } catch (error) {
        // Ignore auto-connect errors
      }
    }
  }, [state.passkeyData, wallet]);
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    if (isInitialized && state.passkeyData) {
      reconnectWallet();
    }
  }, [isInitialized, state.passkeyData, reconnectWallet]);

  /**
   * Persists wallet state to storage
   *
   * @param newState - Partial wallet state to save
   * @returns Promise that resolves when save is complete
   */
  const persistWalletState = useCallback(
    async (newState: Partial<WalletState>): Promise<void> => {
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
   * Creates or authenticates with a passkey using Lazorkit SDK
   *
   * Falls back to wallet.connect() for SDK builds without createPasskeyOnly.
   *
   * @returns Promise resolving to passkey credential data
   * @throws Error if passkey creation or authentication fails
   */
  const loginWithPasskey = useCallback(async (): Promise<PasskeyData> => {
    const currentNetwork = useNetworkStore.getState().network;
    try {
      // Web + mobile both use the same Lazorkit React SDK (web) via polyfills.
      // If SDK supports createPasskeyOnly, use it; otherwise use connect().
      if (wallet?.createPasskeyOnly) {
        const passkeyData = await wallet.createPasskeyOnly();
        if (!passkeyData) {
          throw new Error('Failed to login with passkey');
        }

        const storage = getStorage();
        let storedWalletId: string | null = null;
        if (storage) {
          try {
            const smartWalletIdKey = currentNetwork === 'devnet' ? STORAGE_KEYS.SMART_WALLET_ID_DEVNET : STORAGE_KEYS.SMART_WALLET_ID_MAINNET;
            storedWalletId =
              (await Promise.resolve(storage.getItem(smartWalletIdKey))) || null;
          } catch (error) {
            // Ignore storage read errors
          }
        }

        const enrichedPasskeyData = storedWalletId
          ? {
              ...passkeyData,
              smartWalletId: storedWalletId,
              walletId: storedWalletId,
              smartWalletID: storedWalletId,
            }
          : passkeyData;

        const newState: WalletState = {
          hasPasskey: true,
          hasWallet: state.hasWallet,
          pubkey: state.pubkey,
          passkeyData: enrichedPasskeyData as PasskeyData,
        };

        setState(newState);
        await persistWalletState(newState);

        return enrichedPasskeyData as PasskeyData;
      }

      if (!wallet?.connect) {
        throw new Error('Passkey login not available. Make sure WalletProvider is set up correctly.');
      }

      // Standard web flow of Lazorkit React SDK: connect({ feeMode: "paymaster" })
      const connectedWallet = await wallet.connect({ feeMode: 'paymaster' });
      if (!connectedWallet?.smartWallet) {
        throw new Error('Passkey login failed: missing smart wallet address');
      }

      const passkeyData: PasskeyData = {
        credentialId: connectedWallet.credentialId || '',
        userId: 'web',
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
      await persistWalletState(newState);

      return passkeyData;
    } catch (error) {
      throw error;
    }
  }, [wallet, state.hasWallet, state.pubkey, persistWalletState]);

  /**
   * Creates a smart wallet on-chain using passkey data
   *
   * @param passkeyData - Passkey credential data from loginWithPasskey
   * @returns Promise resolving to wallet public key address
   * @throws Error if wallet creation fails or API call fails
   */
  const createSmartWallet = useCallback(
    async (passkeyData: PasskeyData): Promise<string> => {
      if (!wallet?.createSmartWalletOnly && !wallet?.createSmartWallet) {
        if (state.pubkey) {
          return state.pubkey;
        }
        throw new Error('Smart wallet creation not available');
      }

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

        let apiBase = '';
        
        if (typeof window !== 'undefined') {
          const envApiBase = 
          process.env.NEXT_PUBLIC_API_BASE_URL ||
            (window as any).process?.env?.NEXT_PUBLIC_API_BASE_URL;
          
          if (envApiBase && envApiBase !== 'http://localhost:3001') {
            apiBase = envApiBase;
          } else {
            apiBase = window.location.origin;
          }
        } else {
          const mobileApiBase = (global as any).__LAZOR_MOBILE_API_BASE__;
          if (mobileApiBase) {
            apiBase = mobileApiBase;
          } else {
            apiBase = 'http://localhost:3001';
          }
        }

        const apiUrl = `${apiBase}/api/orders/create-smart-wallet`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            passkeyData: enrichedPasskeyData,
            network: useNetworkStore.getState().network === 'devnet' ? 'devnet' : 'mainnet',
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
        await persistWalletState(newState);

        if (typeof window !== 'undefined') {
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        return walletAddress;
      } catch (error) {
        throw error;
      }
    },
    [wallet, persistWalletState, state.pubkey]
  );

  /**
   * Registers a new wallet by creating both passkey and smart wallet
   *
   * @returns Promise resolving to passkey data and wallet address
   * @throws Error if registration fails at any step
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
   * Logs out user by disconnecting wallet and clearing all stored session data
   *
   * @returns Promise that resolves when logout is complete
   */
  const logout = useCallback(async (): Promise<void> => {
    // Disconnect wallet from Lazorkit SDK first
    if (wallet?.disconnect && typeof wallet.disconnect === 'function') {
      try {
        await wallet.disconnect();
      } catch (error) {
        // Ignore disconnect errors, continue with cleanup
      }
    }

    // Clear storage (both mainnet and devnet)
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

    // Reset state
    setState({
      hasPasskey: false,
      hasWallet: false,
      pubkey: undefined,
      passkeyData: undefined,
    });
  }, [wallet]);

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

