/**
 * Universal Smart Wallet Hook
 * 
 * Provides a unified interface for Smart Wallet operations across Web (Next.js) and Mobile (Expo).
 * Currently supports Web platform. Mobile support coming soon.
 * 
 * @returns {UseSmartWalletReturn} Wallet connection state and methods
 * 
 * @example
 * ```tsx
 * const { wallet, connect, disconnect, isConnected, signAndSendTransaction } = useSmartWallet();
 * 
 * await connect();
 * const signature = await signAndSendTransaction({ 
 *   instructions: [transferInstruction] 
 * });
 * ```
 */

import { useState, useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet';

export interface SmartWallet {
  smartWallet: string; // PDA address
  publicKey: string; // Device key (Passkey public key)
}

export interface UseSmartWalletReturn {
  wallet: SmartWallet | null;
  isConnected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signAndSendTransaction: (params: {
    instructions?: any[];
    transaction?: any;
    transactionOptions?: {
      feeToken?: string;
      computeUnitLimit?: number;
    };
  }) => Promise<string>;
  error: Error | null;
}

export function useSmartWallet(): UseSmartWalletReturn {
  // Always call useWallet hook - this ensures hooks are called in same order
  // This matches the pattern from top repo
  const { connect: sdkConnect, disconnect: sdkDisconnect, wallet: sdkWallet, isConnected: sdkIsConnected, signAndSendTransaction: sdkSignAndSendTransaction } = useWallet();
  
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Map SDK wallet to our SmartWallet interface
  const wallet: SmartWallet | null = sdkWallet ? {
    smartWallet: sdkWallet.smartWallet || '',
    publicKey: (sdkWallet as any).publicKey?.toString() || '',
  } : null;

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      await sdkConnect();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (error.message?.includes('popup') || error.message?.includes('blocked')) {
        throw new Error('Popup blocked! Please allow popups for this site.');
      }
      throw error;
    } finally {
      setConnecting(false);
    }
  }, [sdkConnect]);

  const disconnect = useCallback(async () => {
    sdkDisconnect();
    setError(null);
  }, [sdkDisconnect]);

  const signAndSendTransaction = useCallback(async (params: {
    instructions?: any[];
    transaction?: any;
    transactionOptions?: {
      feeToken?: string;
      computeUnitLimit?: number;
      addressLookupTableAccounts?: any[];
    };
  }): Promise<string> => {
    if (!sdkSignAndSendTransaction) {
      throw new Error('Wallet not connected or SDK not loaded');
    }

    if (!sdkIsConnected || !sdkWallet) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      // SDK requires instructions to be defined
      if (params.instructions) {
        if (!Array.isArray(params.instructions) || params.instructions.length === 0) {
          throw new Error('Instructions array is required and must not be empty');
        }

        console.log('signAndSendTransaction - Calling SDK with:', {
          instructionsCount: params.instructions.length,
          transactionOptions: params.transactionOptions,
          wallet: sdkWallet ? { smartWallet: sdkWallet.smartWallet } : null,
        });

        const result = await sdkSignAndSendTransaction({
          instructions: params.instructions,
          transactionOptions: params.transactionOptions,
        });

        console.log('signAndSendTransaction - Success:', result);
        return result;
      } else if (params.transaction) {
        // If transaction is provided, extract instructions from it
        return await sdkSignAndSendTransaction({
          instructions: params.transaction.message?.instructions || [],
          transactionOptions: params.transactionOptions,
        });
      } else {
        throw new Error('Either instructions or transaction must be provided');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      console.error('signAndSendTransaction - Error:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        instructionsCount: params.instructions?.length,
        wallet: sdkWallet ? { smartWallet: sdkWallet.smartWallet } : null,
      });
      
      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.message?.includes('fetch')) {
        console.error('Network error detected. Check:', {
          rpcUrl: process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL,
          paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL,
          portalUrl: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL,
        });
        throw new Error(`Network error: ${error.message}. Please check your internet connection and LazorKit service configuration.`);
      }
      
      throw error;
    }
  }, [sdkSignAndSendTransaction, sdkIsConnected, sdkWallet]);

  return {
    wallet,
    isConnected: sdkIsConnected,
    connecting,
    connect,
    disconnect,
    signAndSendTransaction,
    error,
  };
}

