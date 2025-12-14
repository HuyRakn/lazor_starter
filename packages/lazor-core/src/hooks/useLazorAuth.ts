'use client';

import { useState, useCallback, useEffect } from 'react';
import { useLazorWallet } from './useLazorWallet';
import type { PasskeyData, WalletState } from '../types';
import { getStorage } from '../utils/storage';

const STORAGE_KEYS = {
  PASSKEY_DATA: 'lazorkit-passkey-data',
  WALLET_ADDRESS: 'lazorkit-wallet-address',
  SMART_WALLET_ID: 'lazorkit-smart-wallet-id',
  HAS_PASSKEY: 'lazorkit-has-passkey',
  HAS_WALLET: 'lazorkit-has-wallet',
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
export function useLazorAuth() {
  const wallet = useLazorWallet();
  const [state, setState] = useState<WalletState>({
    hasPasskey: false,
    hasWallet: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    /**
     * Initializes authentication state from persistent storage
     *
     * Loads passkey data, wallet address, and authentication state
     * from localStorage (Web) or AsyncStorage (Mobile).
     *
     * @returns Promise that resolves when initialization is complete
     */
    const initState = async () => {
      const storage = getStorage();
      if (!storage) {
        setIsInitialized(true);
        return;
      }

      try {
        const hasPasskeyString = await Promise.resolve(storage.getItem(STORAGE_KEYS.HAS_PASSKEY));
        const hasWalletString = await Promise.resolve(storage.getItem(STORAGE_KEYS.HAS_WALLET));
        const pubkey = await Promise.resolve(storage.getItem(STORAGE_KEYS.WALLET_ADDRESS)) || undefined;
        const smartWalletIdString = await Promise.resolve(storage.getItem(STORAGE_KEYS.SMART_WALLET_ID)) || undefined;
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
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    /**
     * Reconnects wallet if passkey data exists but wallet is not connected
     *
     * Automatically attempts to reconnect the wallet when passkey data
     * is available but the wallet connection is lost.
     *
     * @returns Promise that resolves when reconnection attempt completes
     */
    const reconnectWallet = async () => {
      if (!state.passkeyData) {
        return;
      }

      if (!(wallet as any)?.isConnected && !wallet?.signAndSendTransaction) {
        try {
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (wallet?.connect && typeof wallet.connect === 'function') {
            await wallet.connect();
          }
        } catch (error) {
          // Ignore auto-connect errors
        }
      }
    };
    
    if (isInitialized && state.passkeyData) {
      reconnectWallet();
    }
  }, [isInitialized, state.passkeyData, wallet]);

  /**
   * Saves wallet state to persistent storage
   *
   * @param newState - Partial wallet state to save
   * @returns Promise that resolves when save is complete
   */
  const saveToStorage = useCallback(
    async (newState: Partial<WalletState>) => {
      const storage = getStorage();
      if (!storage) return;

      try {
        if (newState.hasPasskey !== undefined) {
          await Promise.resolve(storage.setItem(STORAGE_KEYS.HAS_PASSKEY, String(newState.hasPasskey)));
        }
        if (newState.hasWallet !== undefined) {
          await Promise.resolve(storage.setItem(STORAGE_KEYS.HAS_WALLET, String(newState.hasWallet)));
        }
        if (newState.pubkey !== undefined) {
          if (newState.pubkey) {
            await Promise.resolve(storage.setItem(STORAGE_KEYS.WALLET_ADDRESS, newState.pubkey));
          } else {
            await Promise.resolve(storage.removeItem(STORAGE_KEYS.WALLET_ADDRESS));
          }
        }
        const passkeyDataTyped = newState.passkeyData as any;
        if (passkeyDataTyped?.smartWalletId || passkeyDataTyped?.walletId || passkeyDataTyped?.smartWalletID) {
          const smartWalletId = passkeyDataTyped.smartWalletId || passkeyDataTyped.walletId || passkeyDataTyped.smartWalletID;
          await Promise.resolve(storage.setItem(STORAGE_KEYS.SMART_WALLET_ID, String(smartWalletId)));
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
              await Promise.resolve(storage.setItem(STORAGE_KEYS.SMART_WALLET_ID, String(smartWalletId)));
            } else {
              await Promise.resolve(storage.removeItem(STORAGE_KEYS.SMART_WALLET_ID));
            }
          } else {
            await Promise.resolve(storage.removeItem(STORAGE_KEYS.PASSKEY_DATA));
            await Promise.resolve(storage.removeItem(STORAGE_KEYS.SMART_WALLET_ID));
          }
        }
      } catch (error) {
        // Ignore storage errors
      }
    },
    []
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
    try {
      if (wallet?.createPasskeyOnly) {
        const passkeyData = await wallet.createPasskeyOnly();
        if (!passkeyData) {
          throw new Error('Failed to login with passkey');
        }

        const storage = getStorage();
        let storedWalletId: string | null = null;
        if (storage) {
          try {
            storedWalletId =
              (await Promise.resolve(storage.getItem(STORAGE_KEYS.SMART_WALLET_ID))) || null;
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
        await saveToStorage(newState);

        return enrichedPasskeyData as PasskeyData;
      }

      if (!wallet?.connect) {
        throw new Error('Passkey login not available. Make sure LazorProvider is set up correctly.');
      }

      const connectedWallet = await wallet.connect();
      if (!connectedWallet?.smartWallet) {
        throw new Error('Passkey login failed: missing smart wallet address');
      }

      const passkeyData: PasskeyData = {
        credentialId: connectedWallet.credentialId || '',
        userId: connectedWallet.walletDevice || 'web',
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
  }, [wallet, state.hasWallet, state.pubkey, saveToStorage]);

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
        const storage = getStorage();
        let storedWalletId: string | null = null;
        if (storage) {
          try {
            storedWalletId = await Promise.resolve(storage.getItem(STORAGE_KEYS.SMART_WALLET_ID)) || null;
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

        if (typeof window !== 'undefined') {
          await new Promise(resolve => setTimeout(resolve, 800));
        }

        return walletAddress;
      } catch (error) {
        throw error;
      }
    },
    [wallet, saveToStorage]
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
  }, [wallet, loginWithPasskey, createSmartWallet, state.pubkey]);

  /**
   * Logs out user by disconnecting wallet and clearing all stored session data
   *
   * @returns Promise that resolves when logout is complete
   */
  const logout = useCallback(async () => {
    // Disconnect wallet from Lazorkit SDK first
    if (wallet?.disconnect && typeof wallet.disconnect === 'function') {
      try {
        await wallet.disconnect();
      } catch (error) {
        // Ignore disconnect errors, continue with cleanup
      }
    }

    // Clear storage
    const storage = getStorage();
    if (storage) {
      try {
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.PASSKEY_DATA));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.WALLET_ADDRESS));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.SMART_WALLET_ID));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.HAS_PASSKEY));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.HAS_WALLET));
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
