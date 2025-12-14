'use client';

import { useState, useCallback } from 'react';
import { PublicKey, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';

/**
 * Hook for requesting airdrops on Solana devnet
 *
 * @returns {Object} Airdrop methods and state
 * @returns {(walletAddress: string, amount: number) => Promise<string>} returns.requestSOLAirdrop - Request SOL airdrop
 * @returns {(walletAddress: string, amount: number) => Promise<string>} returns.requestUSDCAirdrop - Request USDC airdrop
 * @returns {boolean} returns.loading - True while airdrop is processing
 * @returns {string|null} returns.error - Error message if airdrop fails
 */
export function useAirdrop() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Requests SOL airdrop from Solana devnet faucet
   *
   * @param walletAddress - Wallet public key address to receive airdrop
   * @param amount - Amount of SOL to request (in SOL, default: 1)
   * @returns Promise resolving to transaction signature
   * @throws Error if airdrop request fails
   */
  const requestSOLAirdrop = useCallback(
    async (walletAddress: string, amount: number = 1): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        if (!walletAddress) {
          throw new Error('Wallet address is required');
        }

        const publicKey = new PublicKey(walletAddress);
        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
        const connection = new Connection(rpcUrl, 'confirmed');
        const lamports = amount * LAMPORTS_PER_SOL;
        
        const signature = await connection.requestAirdrop(publicKey, lamports);
        await connection.confirmTransaction(signature, 'confirmed');

        return signature;
      } catch (err: any) {
        let errorMessage = 'Failed to request SOL airdrop';
        
        if (err?.message) {
          const message = err.message;
          
          // Parse JSON error response if present
          if (message.includes('429') || message.includes('rate limit')) {
            try {
              // Try to extract JSON from error message
              const jsonMatch = message.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const errorObj = JSON.parse(jsonMatch[0]);
                if (errorObj?.error?.message) {
                  errorMessage = errorObj.error.message;
                } else if (errorObj?.message) {
                  errorMessage = errorObj.message;
                }
              } else if (message.includes('429')) {
                errorMessage = 'You have reached your airdrop limit today or the faucet has run dry. Please visit https://faucet.solana.com for alternate sources of test SOL.';
              }
            } catch {
              // If JSON parsing fails, check for 429 in message
              if (message.includes('429')) {
                errorMessage = 'You have reached your airdrop limit today or the faucet has run dry. Please visit https://faucet.solana.com for alternate sources of test SOL.';
              } else {
                errorMessage = message;
              }
            }
          } else {
            errorMessage = message;
          }
        }
        
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Opens Circle Faucet website for USDC airdrop
   *
   * @param walletAddress - Wallet public key address to receive airdrop
   * @param amount - Amount of USDC to request (not used, Circle provides 1 USDC per request)
   * @returns Promise resolving to success message
   * @throws Error if wallet address is invalid
   */
  const requestUSDCAirdrop = useCallback(
    async (walletAddress: string, amount: number = 1): Promise<string> => {
      setLoading(true);
      setError(null);

      try {
        if (!walletAddress) {
          throw new Error('Wallet address is required');
        }

        const publicKey = new PublicKey(walletAddress);

        if (typeof window !== 'undefined') {
          const faucetUrl = `https://faucet.circle.com/?network=Solana%20Devnet&address=${walletAddress}`;
          window.open(faucetUrl, '_blank', 'noopener,noreferrer');
        }

        return 'Circle Faucet opened in new tab. Please complete the request there.';
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to open Circle Faucet';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    requestSOLAirdrop,
    requestUSDCAirdrop,
    loading,
    error,
  };
}
