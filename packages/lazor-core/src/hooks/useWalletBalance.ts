'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useNetworkStore } from '../state/networkStore';

/**
 * Hook to fetch wallet balances (SOL and USDC) from onchain
 *
 * @param walletAddress - Wallet public key address
 * @param usdcMintAddress - USDC mint address (optional)
 * @param rpcUrl - RPC URL (optional, defaults to devnet)
 * @returns {Object} Balance information and loading state
 * @returns {number|undefined} returns.solBalance - SOL balance in SOL units
 * @returns {number|undefined} returns.usdcBalance - USDC balance in token units
 * @returns {string|undefined} returns.solBalanceText - Formatted SOL balance string
 * @returns {string|undefined} returns.usdcBalanceText - Formatted USDC balance string
 * @returns {boolean} returns.loading - True while fetching balances
 * @returns {string|null} returns.error - Error message if fetch fails
 * @returns {() => Promise<void>} returns.refreshBalances - Manually refresh balances
 */
export function useWalletBalance(
  walletAddress: string | null | undefined,
  usdcMintAddress?: string,
  rpcUrl?: string
) {
  const [solBalance, setSolBalance] = useState<number | undefined>(undefined);
  const [usdcBalance, setUsdcBalance] = useState<number | undefined>(undefined);
  const [solBalanceText, setSolBalanceText] = useState<string | undefined>(undefined);
  const [usdcBalanceText, setUsdcBalanceText] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchBalancesRef = useRef<(() => Promise<void>) | null>(null);

    /**
     * Fetches SOL and USDC balances from onchain
     *
     * @returns Promise that resolves when balance fetch completes
     */
  const fetchBalances = useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        if (!walletAddress) {
        setLoading(false);
          return;
        }

        const network = useNetworkStore.getState().network;
        
        // Get RPC URL: check explicit param, then mobile globals, then process.env
        let resolvedRpcUrl = rpcUrl;
        if (!resolvedRpcUrl) {
          if (network === 'devnet') {
            resolvedRpcUrl =
              (global as any).__LAZOR_MOBILE_RPC_URL_DEV__ ||
              process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET ||
              '';
          } else {
            resolvedRpcUrl =
              (global as any).__LAZOR_MOBILE_RPC_URL_MAIN__ ||
              process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL ||
              '';
          }
        }

        if (!resolvedRpcUrl) {
          throw new Error('Missing Lazorkit RPC URL. Set NEXT_PUBLIC_LAZORKIT_RPC_URL or NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET.');
        }

        const connection = new Connection(resolvedRpcUrl);

        const publicKey = new PublicKey(walletAddress);

        const lamports = await connection.getBalance(publicKey);
        const solBalanceAmount = lamports / LAMPORTS_PER_SOL;
        
          setSolBalance(solBalanceAmount);
          const solString = (lamports / LAMPORTS_PER_SOL).toFixed(9).replace(/\.?0+$/, '');
          setSolBalanceText(solString);

        if (usdcMintAddress) {
          try {
            const mintPublicKey = new PublicKey(usdcMintAddress);
          
          try {
            const associatedTokenAddress = await getAssociatedTokenAddress(
              mintPublicKey,
              publicKey
            );

            const tokenAccountInfo = await connection.getTokenAccountBalance(
              associatedTokenAddress
            );

            if (tokenAccountInfo.value) {
              const decimals = tokenAccountInfo.value.decimals;
              const amount = tokenAccountInfo.value.amount;
              const usdcBalanceAmount = Number(amount) / Math.pow(10, decimals);
              setUsdcBalance(usdcBalanceAmount);
              setUsdcBalanceText(tokenAccountInfo.value.uiAmountString || '0');
            } else {
              throw new Error('No value in associated token account');
            }
          } catch (associatedError: any) {
            try {
              const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
                publicKey,
                {
                  mint: mintPublicKey,
                },
                'confirmed'
              );

              if (tokenAccounts.value && tokenAccounts.value.length > 0) {
                const usdcAccount = tokenAccounts.value.find(
                  (account) => account.account.data.parsed.info.mint === usdcMintAddress
                );

                if (usdcAccount) {
                  const tokenAmount = usdcAccount.account.data.parsed.info.tokenAmount;
                  const decimals = tokenAmount.decimals;
                  const amount = tokenAmount.amount;
                  const usdcBalanceAmount = Number(amount) / Math.pow(10, decimals);
                  setUsdcBalance(usdcBalanceAmount);
                  setUsdcBalanceText(tokenAmount.uiAmountString || '0');
                } else {
                  setUsdcBalance(0);
                  setUsdcBalanceText('0');
                }
              } else {
              setUsdcBalance(0);
              setUsdcBalanceText('0');
            }
            } catch (queryError: any) {
              setUsdcBalance(0);
              setUsdcBalanceText('0');
            }
          }
        } catch (tokenError: any) {
          setUsdcBalance(0);
          setUsdcBalanceText('0');
          }
        }
      } catch (err: any) {
          setError(err?.message || 'Failed to fetch balances');
      } finally {
          setLoading(false);
        }
  },
  [walletAddress, usdcMintAddress, rpcUrl]
  );

  fetchBalancesRef.current = fetchBalances;

  /**
   * Manually refreshes wallet balances
   *
   * @returns Promise that resolves when balance refresh completes
   */
  const refreshBalances = useCallback(async () => {
    if (fetchBalancesRef.current) {
      await fetchBalancesRef.current();
    }
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      setSolBalance(undefined);
      setUsdcBalance(undefined);
      setSolBalanceText(undefined);
      setUsdcBalanceText(undefined);
      setLoading(false);
      return;
    }

    let isCancelled = false;

    fetchBalances();

    const interval = setInterval(() => {
      if (!isCancelled) {
        fetchBalances();
      }
    }, 10000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [walletAddress, usdcMintAddress, rpcUrl, fetchBalances]);

  return { 
    solBalance, 
    usdcBalance, 
    solBalanceText, 
    usdcBalanceText, 
    loading, 
    error,
    refreshBalances,
  };
}
