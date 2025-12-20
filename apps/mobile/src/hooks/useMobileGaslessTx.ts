/**
 * Mobile-specific gasless transaction hook using @lazorkit/wallet-mobile-adapter
 * 
 * Follows React Native SDK docs exactly:
 * - signAndSendTransaction(payload, { redirectUrl }) - required redirectUrl
 * - Uses useWallet from @lazorkit/wallet-mobile-adapter
 */

import { useCallback } from 'react';
import { useWallet } from '@lazorkit/wallet-mobile-adapter';
import { TransactionInstruction, SystemProgram, PublicKey } from '@solana/web3.js';
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { useNetworkStore } from '@lazor-starter/core';
import Constants from 'expo-constants';
import type { GaslessTxOptions } from '@lazor-starter/core';
import { useMobileAuth } from './useMobileAuth';

/**
 * Get redirect URL for callbacks
 */
function getRedirectUrl(): string {
  const scheme = Constants.expoConfig?.scheme || 'lazor-starter';
  return `${scheme}://callback`;
}

/**
 * Mobile gasless transaction hook using React Native SDK
 * 
 * Provides the same API as useGaslessTx but uses @lazorkit/wallet-mobile-adapter
 * with proper redirectUrl handling for deep linking.
 */
export function useMobileGaslessTx() {
  const walletHook = useWallet();
  const { signAndSendTransaction, connect } = walletHook;
  // Access wallet property safely (type definition may not be complete)
  const wallet = (walletHook as any).wallet as { smartWallet?: string } | undefined;
  const { pubkey } = useMobileAuth(); // Get wallet address from auth hook
  const network = useNetworkStore((state) => state.network);

  /**
   * Send transaction with multiple instructions
   * 
   * Uses signAndSendTransaction(payload, { redirectUrl }) as per React Native SDK docs
   */
  const sendTransaction = useCallback(
    async (
      instructions: TransactionInstruction[],
      options?: GaslessTxOptions
    ): Promise<string> => {
      const attemptTransaction = async (): Promise<string> => {
        if (!signAndSendTransaction) {
          throw new Error('signAndSendTransaction not available');
        }
        
        if (!instructions || instructions.length === 0) {
          throw new Error('No instructions provided for transaction');
        }
        
        // Validate all instructions
        for (const ix of instructions) {
          if (!ix || !ix.programId) {
            throw new Error('Invalid instruction provided');
          }
        }
        
        // Get wallet address - prefer from auth hook, fallback to wallet from useWallet()
        const activeAddress = pubkey || wallet?.smartWallet;
        if (!activeAddress || typeof activeAddress !== 'string') {
          throw new Error('No wallet address. Please login first.');
        }
        
        // Validate PublicKey format
        try {
          new PublicKey(activeAddress);
        } catch (error) {
          throw new Error(`Invalid wallet address: ${activeAddress}`);
        }
        
        // Prepare transaction options according to React Native SDK API
        const transactionOptions: {
          feeToken?: string;
          computeUnitLimit?: number;
          clusterSimulation: 'devnet' | 'mainnet';
        } = {
          clusterSimulation: network, // Required by React Native SDK
        };
        
        if (options?.feeToken) {
          transactionOptions.feeToken = options.feeToken;
        }
        
        if (options?.computeUnitLimit) {
          transactionOptions.computeUnitLimit = options.computeUnitLimit;
        }
        
        // Mobile adapter API: signAndSendTransaction(payload, { redirectUrl })
        const redirectUrl = getRedirectUrl();
        
        return await signAndSendTransaction(
          {
            instructions,
            transactionOptions,
          },
          {
            redirectUrl,
            onSuccess: (sig) => {
              console.log('✅ Transaction sent:', sig);
            },
            onFail: (err) => {
              console.error('❌ Transaction failed:', err);
            },
          }
        );
      };

      try {
        return await attemptTransaction();
      } catch (error: any) {
        const errorMsg = error?.message || String(error);
        
        const isConnectionError = 
          errorMsg.includes('not connected') || 
          errorMsg.includes('No wallet connected') ||
          errorMsg.includes('Received type undefined') ||
          errorMsg.includes('Signer not found');

        if (isConnectionError && connect && typeof connect === 'function') {
          try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Reconnect with redirectUrl
            const redirectUrl = getRedirectUrl();
            await connect({
              redirectUrl: redirectUrl.replace('://callback', '://home'),
              onSuccess: () => {
                console.log('✅ Reconnected to wallet');
              },
              onFail: (e) => {
                console.error('❌ Reconnection failed:', e);
              },
            });
            
            await new Promise(resolve => setTimeout(resolve, 500));
            return await attemptTransaction();
          } catch (connectError: any) {
            throw new Error('Wallet not connected. Please login again.');
          }
        }
        
        throw error;
      }
    },
    [signAndSendTransaction, wallet, network, connect]
  );

  /**
   * Transfer SOL tokens
   */
  const transferSOL = useCallback(
    async (
      recipient: string,
      amount: number,
      options?: GaslessTxOptions
    ): Promise<string> => {
      const activeAddress = pubkey || wallet?.smartWallet;
      if (!activeAddress) {
        throw new Error('No wallet address. Please login first.');
      }

      const ownerPublicKey = new PublicKey(activeAddress);
      const recipientPublicKey = new PublicKey(recipient);
      const lamports = Math.round(amount * 1e9);

      const transferIx = SystemProgram.transfer({
        fromPubkey: ownerPublicKey,
        toPubkey: recipientPublicKey,
        lamports,
      });

      return sendTransaction([transferIx], options);
    },
    [pubkey, wallet, sendTransaction]
  );

  /**
   * Transfer SPL tokens (USDC, etc.)
   */
  const transferSPLToken = useCallback(
    async (
      recipient: string,
      amount: number,
      tokenMint: string,
      decimals: number = 6,
      options?: GaslessTxOptions
    ): Promise<string> => {
      const activeAddress = pubkey || wallet?.smartWallet;
      if (!activeAddress) {
        throw new Error('No wallet address. Please login first.');
      }

      const smartWalletPubkey = new PublicKey(activeAddress);
      const recipientPublicKey = new PublicKey(recipient);
      const mintPublicKey = new PublicKey(tokenMint);
      const rawAmount = Math.round(amount * Math.pow(10, decimals));

      // Get ATA for smart wallet (sender)
      const ATA = getAssociatedTokenAddressSync(
        mintPublicKey,
        smartWalletPubkey,
        true,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Get ATA for recipient
      const recipientATA = getAssociatedTokenAddressSync(
        mintPublicKey,
        recipientPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Create transfer instruction
      const instruction = createTransferInstruction(
        ATA,
        recipientATA,
        smartWalletPubkey,
        rawAmount
      );

      return await sendTransaction([instruction], options);
    },
    [pubkey, wallet, sendTransaction]
  );

  return {
    sendTransaction,
    transferSOL,
    transferSPLToken,
  };
}

