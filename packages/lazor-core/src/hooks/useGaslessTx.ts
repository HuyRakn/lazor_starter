'use client';

import { useCallback } from 'react';
import { useLazorWallet } from './useLazorWallet';
import { useLazorAuth } from './useLazorAuth';
import { TransactionInstruction, SystemProgram, PublicKey } from '@solana/web3.js';
import * as splToken from '@solana/spl-token';
import type { GaslessTxOptions } from '../types';

export function useGaslessTx() {
  const wallet = useLazorWallet();
  const { pubkey, passkeyData, isLoggedIn } = useLazorAuth();

  const sendTransaction = useCallback(async (
    instructions: TransactionInstruction[],
    options?: GaslessTxOptions
  ): Promise<string> => {
    const attemptTransaction = async (): Promise<string> => {
      if (!wallet?.signAndSendTransaction) {
        throw new Error('signAndSendTransaction not available');
      }
      return await wallet.signAndSendTransaction(instructions);
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

  const transferSOL = useCallback(async (
    recipient: string,
    amount: number,
    options?: GaslessTxOptions
  ): Promise<string> => {
    const activeAddress = pubkey || (wallet as any)?.address || (wallet as any)?.publicKey?.toBase58?.();
    if (!activeAddress) {
      throw new Error('No wallet address. Please login first.');
    }

    const owner = new PublicKey(activeAddress);
    const recipientPk = new PublicKey(recipient);
    const lamports = Math.round(amount * 1e9);

    const transferIx = SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey: recipientPk,
      lamports,
    });

    return sendTransaction([transferIx], options);
  }, [wallet, pubkey, sendTransaction]);

  const transferSPLToken = useCallback(async (
    recipient: string,
    amount: number,
    tokenMint: string,
    decimals: number = 6,
    options?: GaslessTxOptions
  ): Promise<string> => {
    const activeAddress = pubkey || (wallet as any)?.address || (wallet as any)?.publicKey?.toBase58?.();
    if (!activeAddress) {
      throw new Error('No wallet address. Please login first.');
    }

    const owner = new PublicKey(activeAddress);
    const recipientPk = new PublicKey(recipient);
    const mintPk = new PublicKey(tokenMint);
    const rawAmount = Math.round(amount * Math.pow(10, decimals));

    const fromAta = await (splToken as any).getAssociatedTokenAddress(
      mintPk,
      owner,
      true,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );

    let toAta;
    try {
      toAta = await (splToken as any).getAssociatedTokenAddress(
        mintPk,
        recipientPk,
        false,
        splToken.TOKEN_PROGRAM_ID,
        splToken.ASSOCIATED_TOKEN_PROGRAM_ID
      );
    } catch (err: any) {
      if (err?.name === 'TokenOwnerOffCurveError' || /OffCurve/i.test(String(err?.message))) {
        toAta = await (splToken as any).getAssociatedTokenAddress(
          mintPk,
          recipientPk,
          true,
          splToken.TOKEN_PROGRAM_ID,
          splToken.ASSOCIATED_TOKEN_PROGRAM_ID
        );
      } else {
        throw err;
      }
    }

    const instructions: TransactionInstruction[] = [];

    const createFromAtaIx = (splToken as any).createAssociatedTokenAccountIdempotentInstruction(
      owner,
      fromAta,
      owner,
      mintPk,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );
    instructions.push(createFromAtaIx);

    const createToAtaIx = (splToken as any).createAssociatedTokenAccountIdempotentInstruction(
      owner,
      toAta,
      recipientPk,
      mintPk,
      splToken.TOKEN_PROGRAM_ID,
      splToken.ASSOCIATED_TOKEN_PROGRAM_ID
    );
    instructions.push(createToAtaIx);

    const transferIx = typeof (splToken as any).createTransferInstruction === 'function'
      ? (splToken as any).createTransferInstruction(
          fromAta,
          toAta,
          owner,
          rawAmount,
          [],
          splToken.TOKEN_PROGRAM_ID
        )
      : (splToken as any).createTransferCheckedInstruction(
          fromAta,
          mintPk,
          toAta,
          owner,
          rawAmount,
          decimals,
          [],
          splToken.TOKEN_PROGRAM_ID
        );
    instructions.push(transferIx);

    return sendTransaction(instructions, options);
  }, [wallet, pubkey, sendTransaction]);

  return {
    sendTransaction,
    transferSOL,
    transferSPLToken,
  };
}




