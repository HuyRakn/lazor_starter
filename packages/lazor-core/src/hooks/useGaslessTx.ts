'use client';

import { useCallback } from 'react';
import { useLazorWallet } from './useLazorWallet';
import { useLazorAuth } from './useLazorAuth';
import { TransactionInstruction, SystemProgram, PublicKey } from '@solana/web3.js';
import { useNetworkStore } from '../state/networkStore';
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { GaslessTxOptions } from '../types';

/**
 * Hook for executing gasless transactions through Lazorkit Paymaster
 *
 * @returns {Object} Transaction methods
 * @returns {(instructions: TransactionInstruction[], options?: GaslessTxOptions) => Promise<string>} returns.sendTransaction - Send custom transaction instructions
 * @returns {(recipient: string, amount: number, options?: GaslessTxOptions) => Promise<string>} returns.transferSOL - Transfer SOL tokens
 * @returns {(recipient: string, amount: number, tokenMint: string, decimals?: number, options?: GaslessTxOptions) => Promise<string>} returns.transferSPLToken - Transfer SPL tokens (USDC, etc.)
 */
export function useGaslessTx() {
  const wallet = useLazorWallet();
  const { pubkey, isLoggedIn } = useLazorAuth();
  const network = useNetworkStore((state) => state.network);

  /**
   * Sends a transaction with multiple instructions through Lazorkit Paymaster
   *
   * Uses Lazorkit SDK v2.0.0 API: signAndSendTransaction({ instructions, transactionOptions })
   *
   * @param instructions - Array of transaction instructions to execute
   * @param options - Optional gasless transaction options
   * @returns Promise resolving to transaction signature (base58 string)
   * @throws Error if wallet is not connected or transaction fails
   */
  const sendTransaction = useCallback(async (
    instructions: TransactionInstruction[],
    options?: GaslessTxOptions
  ): Promise<string> => {
    const attemptTransaction = async (): Promise<string> => {
      if (!wallet?.signAndSendTransaction) {
        throw new Error('signAndSendTransaction not available');
      }
      
      if (!instructions || instructions.length === 0) {
        throw new Error('No instructions provided for transaction');
      }
      
      for (const ix of instructions) {
        if (!ix || !ix.programId) {
          throw new Error('Invalid instruction provided');
        }
      }
      
      const activeAddress = 
        pubkey || 
        (wallet as any)?.smartWallet || 
        (wallet as any)?.smartWalletPubkey?.toBase58?.() ||
        (wallet as any)?.address || 
        (wallet as any)?.publicKey?.toBase58?.();
      
      if (!activeAddress || typeof activeAddress !== 'string') {
        throw new Error('No wallet address. Please login first.');
      }
      
      try {
        new PublicKey(activeAddress);
      } catch (error) {
        throw new Error(`Invalid wallet address: ${activeAddress}`);
      }
      
      const transactionOptions: {
        feeToken?: string;
        computeUnitLimit?: number;
        clusterSimulation?: 'devnet' | 'mainnet';
      } = {};
      
      if (options?.feeToken) {
        transactionOptions.feeToken = options.feeToken;
      }
      
      if (options?.computeUnitLimit) {
        transactionOptions.computeUnitLimit = options.computeUnitLimit;
      }
      
      transactionOptions.clusterSimulation = network;

      return await wallet.signAndSendTransaction({
        instructions,
        transactionOptions,
      });
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

      if (isConnectionError && isLoggedIn && wallet?.connect && typeof wallet.connect === 'function') {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          await wallet.connect({ feeMode: 'paymaster' });
          await new Promise(resolve => setTimeout(resolve, 500));
          return await attemptTransaction();
        } catch (connectError: any) {
          throw new Error('Wallet not connected. Please login again.');
        }
      }
      
      throw error;
    }
  }, [wallet, isLoggedIn, network]);

  /**
   * Transfers SOL tokens to a recipient address (gasless)
   *
   * @param recipient - Recipient wallet public key address
   * @param amount - Amount of SOL to transfer (in SOL, not lamports)
   * @param options - Optional gasless transaction options
   * @returns Promise resolving to transaction signature
   * @throws Error if wallet is not connected or transfer fails
   */
  const transferSOL = useCallback(async (
    recipient: string,
    amount: number,
    options?: GaslessTxOptions
  ): Promise<string> => {
    let ownerPublicKey: PublicKey;
    
    if ((wallet as any)?.smartWalletPubkey instanceof PublicKey) {
      ownerPublicKey = (wallet as any).smartWalletPubkey;
    } else {
      const activeAddress = 
        pubkey || 
        (wallet as any)?.smartWallet || 
        (wallet as any)?.smartWalletPubkey?.toBase58?.() ||
        (wallet as any)?.address || 
        (wallet as any)?.publicKey?.toBase58?.();
      if (!activeAddress) {
        throw new Error('No wallet address. Please login first.');
      }
      ownerPublicKey = new PublicKey(activeAddress);
    }

    const recipientPublicKey = new PublicKey(recipient);
    const lamports = Math.round(amount * 1e9);

    const transferIx = SystemProgram.transfer({
      fromPubkey: ownerPublicKey,
      toPubkey: recipientPublicKey,
      lamports,
    });

    return sendTransaction([transferIx], options);
  }, [wallet, pubkey, sendTransaction]);

  /**
   * Transfers SPL tokens (USDC, USDT, etc.) to a recipient address (gasless)
   *
   * @param recipient - Recipient wallet public key address
   * @param amount - Amount of tokens to transfer (in token units, e.g. 1.5 USDC)
   * @param tokenMint - Token mint public key address
   * @param decimals - Token decimals (default: 6 for USDC)
   * @param options - Optional gasless transaction options
   * @returns Promise resolving to transaction signature
   * @throws Error if wallet is not connected, token accounts don't exist, or transfer fails
   */
  const transferSPLToken = useCallback(async (
    recipient: string,
    amount: number,
    tokenMint: string,
    decimals: number = 6,
    options?: GaslessTxOptions
  ): Promise<string> => {
    let smartWalletPubkey: PublicKey;
    
    if ((wallet as any)?.smartWalletPubkey instanceof PublicKey) {
      smartWalletPubkey = (wallet as any).smartWalletPubkey;
    } else {
      const activeAddress = 
        pubkey || 
        (wallet as any)?.smartWallet || 
        (wallet as any)?.smartWalletPubkey?.toBase58?.() ||
        (wallet as any)?.address || 
        (wallet as any)?.publicKey?.toBase58?.();
      if (!activeAddress) {
        throw new Error('No wallet address. Please login first.');
      }
      smartWalletPubkey = new PublicKey(activeAddress);
    }

    const recipientPublicKey = new PublicKey(recipient);
    const mintPublicKey = new PublicKey(tokenMint);
    const rawAmount = Math.round(amount * Math.pow(10, decimals));

    const ATA = getAssociatedTokenAddressSync(
      mintPublicKey,
      smartWalletPubkey,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const recipientATA = getAssociatedTokenAddressSync(
      mintPublicKey,
      recipientPublicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const instruction = createTransferInstruction(
      ATA,
      recipientATA,
      smartWalletPubkey,
      rawAmount
    );

    return await sendTransaction([instruction], options);
  }, [wallet, pubkey, sendTransaction]);

  return {
    sendTransaction,
    transferSOL,
    transferSPLToken,
  };
}
