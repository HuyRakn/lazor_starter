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

export function useLazorAuth() {
  const wallet = useLazorWallet();
  const [state, setState] = useState<WalletState>({
    hasPasskey: false,
    hasWallet: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initState = async () => {
    const storage = getStorage();
    if (!storage) {
        setIsInitialized(true);
        return;
    }

      try {
        const hasPasskeyStr = await Promise.resolve(storage.getItem(STORAGE_KEYS.HAS_PASSKEY));
        const hasWalletStr = await Promise.resolve(storage.getItem(STORAGE_KEYS.HAS_WALLET));
        const pubkey = await Promise.resolve(storage.getItem(STORAGE_KEYS.WALLET_ADDRESS)) || undefined;
        const smartWalletIdStr = await Promise.resolve(storage.getItem(STORAGE_KEYS.SMART_WALLET_ID)) || undefined;
        const passkeyDataStr = await Promise.resolve(storage.getItem(STORAGE_KEYS.PASSKEY_DATA));
        
        const hasPasskey = hasPasskeyStr === 'true';
        const hasWallet = hasWalletStr === 'true';
    let passkeyData: PasskeyData | undefined;

    if (passkeyDataStr) {
      try {
        passkeyData = JSON.parse(passkeyDataStr);
        if (smartWalletIdStr && passkeyData) {
          (passkeyData as any).smartWalletId = smartWalletIdStr;
          (passkeyData as any).walletId = smartWalletIdStr;
          (passkeyData as any).smartWalletID = smartWalletIdStr;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

        setState({ hasPasskey, hasWallet, pubkey, passkeyData });
      } catch (e) {
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
        const passkeyDataAny = newState.passkeyData as any;
        if (passkeyDataAny?.smartWalletId || passkeyDataAny?.walletId || passkeyDataAny?.smartWalletID) {
          const smartWalletId = passkeyDataAny.smartWalletId || passkeyDataAny.walletId || passkeyDataAny.smartWalletID;
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
      } catch (e) {
        // Ignore storage errors
      }
    },
    []
  );

  const loginWithPasskey = useCallback(async (): Promise<PasskeyData> => {
    if (!wallet?.createPasskeyOnly) {
      throw new Error(
        'Passkey login not available. Make sure LazorProvider is set up correctly.'
      );
    }

    try {
      const passkeyData = await wallet.createPasskeyOnly();
      if (!passkeyData) {
        throw new Error('Failed to login with passkey');
      }

      const storage = getStorage();
      let smartWalletIdFromStorage: string | null = null;
      if (storage) {
        try {
          smartWalletIdFromStorage = await Promise.resolve(storage.getItem(STORAGE_KEYS.SMART_WALLET_ID)) || null;
        } catch (e) {
          // Ignore storage read errors
        }
      }

      const passkeyDataWithWalletId = smartWalletIdFromStorage
        ? {
            ...passkeyData,
            smartWalletId: smartWalletIdFromStorage,
            walletId: smartWalletIdFromStorage,
            smartWalletID: smartWalletIdFromStorage,
          }
        : passkeyData;

      const newState: WalletState = {
        hasPasskey: true,
        hasWallet: state.hasWallet,
        pubkey: state.pubkey,
        passkeyData: passkeyDataWithWalletId as PasskeyData,
      };

      setState(newState);
      await saveToStorage(newState);

      return passkeyDataWithWalletId as PasskeyData;
    } catch (error) {
      throw error;
    }
  }, [wallet, state.hasWallet, state.pubkey, saveToStorage]);

  const createSmartWallet = useCallback(
    async (passkeyData: PasskeyData): Promise<string> => {
      if (!wallet?.createSmartWalletOnly && !wallet?.createSmartWallet) {
        throw new Error('Smart wallet creation not available');
      }

      try {
        const storage = getStorage();
        let smartWalletIdFromStorage: string | null = null;
        if (storage) {
          try {
            smartWalletIdFromStorage = await Promise.resolve(storage.getItem(STORAGE_KEYS.SMART_WALLET_ID)) || null;
          } catch (e) {
            // Ignore storage read errors
          }
        }

        const passkeyDataAny = passkeyData as any;
        const passkeyDataWithWalletId = smartWalletIdFromStorage
          ? {
              ...passkeyData,
              smartWalletId: smartWalletIdFromStorage,
              walletId: smartWalletIdFromStorage,
              smartWalletID: smartWalletIdFromStorage,
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
        
        const resp = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ passkeyData: passkeyDataWithWalletId }),
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({} as any));
          throw new Error(err?.error || 'Failed to create smart wallet');
        }

        const data = await resp.json();
        const walletAddress = data?.walletAddress;
        const smartWalletIdFromApi = data?.smartWalletId;
        const smartWalletId = smartWalletIdFromApi || smartWalletIdFromStorage || (passkeyDataWithWalletId as any)?.smartWalletId;

        if (!walletAddress) {
          throw new Error('No wallet address returned');
        }

        const finalPasskeyData = {
          ...passkeyDataWithWalletId,
          smartWalletId: smartWalletId || (passkeyDataWithWalletId as any)?.smartWalletId,
          walletId: smartWalletId || (passkeyDataWithWalletId as any)?.smartWalletId,
          smartWalletID: smartWalletId || (passkeyDataWithWalletId as any)?.smartWalletId,
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

  const registerNewWallet = useCallback(async (): Promise<{
    passkeyData: PasskeyData;
    walletAddress: string;
  }> => {
    const passkeyData = await loginWithPasskey();
    const walletAddress = await createSmartWallet(passkeyData);

    return { passkeyData, walletAddress };
  }, [wallet, loginWithPasskey, createSmartWallet]);

  const logout = useCallback(async () => {
    const storage = getStorage();
    if (storage) {
      try {
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.PASSKEY_DATA));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.WALLET_ADDRESS));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.SMART_WALLET_ID));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.HAS_PASSKEY));
        await Promise.resolve(storage.removeItem(STORAGE_KEYS.HAS_WALLET));
      } catch (e) {
        // Ignore storage errors
      }
    }

    setState({
      hasPasskey: false,
      hasWallet: false,
      pubkey: undefined,
      passkeyData: undefined,
    });
  }, []);

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
