'use client';

import { useCallback } from 'react';
import { useLazorWallet } from './useLazorWallet';
import { useLazorAuth } from './useLazorAuth';
import { TransactionInstruction, SystemProgram, PublicKey, Connection, Transaction } from '@solana/web3.js';
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

  /**
   * Sends a transaction with multiple instructions through Lazorkit Paymaster
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
      
      // Get wallet address first
      const activeAddress = 
        pubkey || 
        (wallet as any)?.smartWallet || 
        (wallet as any)?.smartWalletPubkey?.toBase58?.() ||
        (wallet as any)?.address || 
        (wallet as any)?.publicKey?.toBase58?.();
      
      if (!activeAddress || typeof activeAddress !== 'string') {
        throw new Error('No wallet address. Please login first.');
      }
      
      // Validate PublicKey before creating transaction
      let feePayer: PublicKey;
      try {
        feePayer = new PublicKey(activeAddress);
      } catch (error) {
        throw new Error(`Invalid wallet address: ${activeAddress}`);
      }
      
      // Get recent blockhash and create Transaction object
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 
                     process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL ||
                     'https://api.devnet.solana.com';
      const connection = new Connection(rpcUrl, 'confirmed');
      
      let blockhash: string;
      try {
        const latestBlockhash = await connection.getLatestBlockhash('confirmed');
        blockhash = latestBlockhash.blockhash;
      } catch (error) {
        throw new Error('Failed to get recent blockhash. Please check your RPC connection.');
      }
      
      // Create transaction and add instructions
      const transaction = new Transaction();
      
      // Set blockhash and fee payer
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = feePayer;
      
      // Add all instructions to transaction
      for (const ix of instructions) {
        if (!ix || !ix.programId) {
          throw new Error('Invalid instruction provided');
        }
        transaction.add(ix);
      }
      
      // Validate transaction before sending
      if (!transaction.recentBlockhash || transaction.recentBlockhash.length === 0) {
        throw new Error('Transaction missing recent blockhash');
      }
      if (!transaction.feePayer) {
        throw new Error('Transaction missing fee payer');
      }
      if (transaction.instructions.length === 0) {
        throw new Error('Transaction has no instructions');
      }
      
      // Pass transaction directly to signAndSendTransaction
      // Lazorkit SDK should accept Transaction object
      // If SDK only accepts single instruction, we'll need to handle multiple instructions differently
      if (instructions.length === 1) {
        // If only one instruction, pass it directly
        return await wallet.signAndSendTransaction(instructions[0]);
      } else {
        // For multiple instructions, pass the transaction object
        // SDK might accept Transaction object even if type says otherwise
        return await wallet.signAndSendTransaction(transaction as any);
      }
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
          await wallet.connect();
          await new Promise(resolve => setTimeout(resolve, 500));
          return await attemptTransaction();
        } catch (connectError: any) {
          throw new Error('Wallet not connected. Please login again.');
        }
      }
      
      throw error;
    }
  }, [wallet, isLoggedIn]);

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
    const activeAddress = 
      pubkey || 
      (wallet as any)?.smartWallet || 
      (wallet as any)?.smartWalletPubkey?.toBase58?.() ||
      (wallet as any)?.address || 
      (wallet as any)?.publicKey?.toBase58?.();
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
    const activeAddress = 
      pubkey || 
      (wallet as any)?.smartWallet || 
      (wallet as any)?.smartWalletPubkey?.toBase58?.() ||
      (wallet as any)?.address || 
      (wallet as any)?.publicKey?.toBase58?.();
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

    // Send transaction
    return await sendTransaction([instruction], options);
  }, [wallet, pubkey, sendTransaction]);

  return {
    sendTransaction,
    transferSOL,
    transferSPLToken,
  };
}
