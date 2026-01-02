/**
 * Jupiter Swap Integration Hook
 * 
 * Integrates Jupiter Aggregator v6 API with LazorKit Smart Wallets for gasless token swaps.
 * Supports Versioned Transactions (v0) and Address Lookup Tables.
 * 
 * @returns {UseJupiterSwapReturn} Swap methods and state
 * 
 * @example
 * ```tsx
 * const { executeSwap, getQuote, loading } = useJupiterSwap();
 * 
 * const quote = await getQuote({
 *   inputMint: 'So11111111111111111111111111111111111111112',
 *   outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
 *   amount: 1.0,
 *   slippageBps: 50
 * });
 * 
 * const signature = await executeSwap({ ...quote });
 * ```
 */

import { useState, useCallback } from 'react';
import { VersionedTransaction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { useSmartWallet } from './useSmartWallet';
import { getConnection } from '../utils/solana';

// Buffer polyfill for browser/mobile
let Buffer: any;
if (typeof window !== 'undefined' && (window as any).Buffer) {
  Buffer = (window as any).Buffer;
} else if (typeof global !== 'undefined' && (global as any).Buffer) {
  Buffer = (global as any).Buffer;
} else {
  try {
    Buffer = require('buffer').Buffer;
  } catch {
    throw new Error('Buffer is required. Please ensure buffer polyfill is installed.');
  }
}

export interface SwapParams {
  inputMint: string; // Token mint address to swap from
  outputMint: string; // Token mint address to swap to
  amount: number; // Amount in human-readable format (e.g., 1.0 SOL)
  slippageBps?: number; // Slippage in basis points (default: 50 = 0.5%)
  feeToken?: string; // Optional: Pay fees with output token instead of SOL
}

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: string;
  routePlan: any;
}

export interface UseJupiterSwapReturn {
  executeSwap: (params: SwapParams) => Promise<string>;
  getQuote: (params: SwapParams) => Promise<SwapQuote | null>;
  loading: boolean;
  error: Error | null;
  lastSignature: string | null;
}

const JUPITER_API_URL = 'https://quote-api.jup.ag/v6';

/**
 * Retrieves token decimals for amount conversion
 * @param {string} mint - Token mint address
 * @returns {Promise<number>} Token decimals (default: 6)
 */
async function getTokenDecimals(mint: string): Promise<number> {
  const connection = getConnection();
  try {
    const mintPubkey = new PublicKey(mint);
    const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
    const data = mintInfo.value?.data;
    if (data && 'parsed' in data && data.parsed.info.decimals) {
      return data.parsed.info.decimals;
    }
    // Default decimals for common tokens
    if (mint === 'So11111111111111111111111111111111111111112') return 9; // SOL
    if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') return 6; // USDC
    return 6; // Default
  } catch {
    return 6;
  }
}

/**
 * Converts human-readable amount to raw amount with decimals
 * @param {number} amount - Human-readable amount (e.g., 1.0)
 * @param {string} mint - Token mint address
 * @returns {Promise<string>} Raw amount as string
 */
async function toRawAmount(
  amount: number,
  mint: string
): Promise<string> {
  const decimals = await getTokenDecimals(mint);
  return Math.floor(amount * Math.pow(10, decimals)).toString();
}

export function useJupiterSwap(): UseJupiterSwapReturn {
  const { wallet, isConnected, signAndSendTransaction } = useSmartWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  /**
   * Fetches swap quote from Jupiter API
   * @param {SwapParams} params - Swap parameters
   * @returns {Promise<SwapQuote | null>} Swap quote or null
   * @throws {Error} If wallet not connected or API error
   */
  const getQuote = useCallback(async (params: SwapParams): Promise<SwapQuote | null> => {
    if (!isConnected || !wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const rawAmount = await toRawAmount(params.amount, params.inputMint);
      const slippageBps = params.slippageBps || 50;

          const quoteParams = new URLSearchParams({
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            amount: rawAmount,
            slippageBps: slippageBps.toString(),
            onlyDirectRoutes: 'false',
            // Jupiter v6 API defaults to v0 transactions (VersionedTransaction)
            // LazorKit Smart Wallets support v0 transactions natively
          });

      const url = `${JUPITER_API_URL}/quote?${quoteParams}`;
      console.log('Jupiter API Request:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        let errorMessage = `Failed to fetch quote: ${response.status} ${response.statusText}`;
        try {
          const errorText = await response.text();
          // Try to parse as JSON, but don't fail if it's not JSON
          if (errorText && errorText.trim().startsWith('{')) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              // If JSON parse fails, use the text as is
              errorMessage = errorText || errorMessage;
            }
          } else {
            errorMessage = errorText || errorMessage;
          }
        } catch {
          // If response.text() fails, use default message
        }
        throw new Error(errorMessage);
      }

      const quote = await response.json();

      if (quote.error) {
        throw new Error(quote.error);
      }

      if (!quote || !quote.outAmount) {
        throw new Error('Invalid quote response from Jupiter API');
      }

      return quote;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Jupiter getQuote error:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED') || error.message?.includes('NetworkError')) {
        throw new Error('Network error: Cannot connect to Jupiter API. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }, [isConnected, wallet]);

  /**
   * Executes swap transaction via LazorKit Paymaster
   * @param {SwapParams} params - Swap parameters
   * @returns {Promise<string>} Transaction signature
   * @throws {Error} If wallet not connected, quote failed, or transaction failed
   */
  const executeSwap = useCallback(async (params: SwapParams): Promise<string> => {
    if (!isConnected || !wallet) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);

    try {
      const connection = getConnection();
      
      const quote = await getQuote(params);
      if (!quote) {
        throw new Error('Failed to get swap quote');
      }
      const swapResponse = await fetch(`${JUPITER_API_URL}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: wallet.smartWallet,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      const swapData = await swapResponse.json();

      if (swapData.error) {
        throw new Error(swapData.error);
      }

      if (!swapData.swapTransaction) {
        throw new Error('No swap transaction returned from Jupiter');
      }

      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      const message = transaction.message;
      const COMPUTE_BUDGET_PROGRAM = new PublicKey('ComputeBudget111111111111111111111111111111');
      const instructions: TransactionInstruction[] = [];
      const staticKeys = message.staticAccountKeys;
      for (const compiledIx of message.compiledInstructions) {
        const programId = staticKeys[compiledIx.programIdIndex];
        
        if (programId.equals(COMPUTE_BUDGET_PROGRAM)) {
          continue;
        }

        const keys = compiledIx.accountKeyIndexes.map(keyIndex => {
          const pubkey = staticKeys[keyIndex];
          const isSigner = keyIndex < message.header.numRequiredSignatures;
          const isWritable = 
            (keyIndex < message.header.numRequiredSignatures - message.header.numReadonlySignedAccounts) ||
            (keyIndex >= message.header.numRequiredSignatures && 
             keyIndex < staticKeys.length - message.header.numReadonlyUnsignedAccounts);
          
          return {
            pubkey,
            isSigner,
            isWritable: isWritable ?? false,
          };
        });

        const hasSmartWallet = keys.some(k => k.pubkey.toBase58() === wallet.smartWallet);
        if (!hasSmartWallet) {
          keys.push({
            pubkey: new PublicKey(wallet.smartWallet),
            isSigner: false,
            isWritable: false,
          });
        }

        instructions.push({
          programId,
          keys,
          data: Buffer.from(compiledIx.data),
        } as TransactionInstruction);
      }

      const signature = await signAndSendTransaction({
        instructions,
        transactionOptions: {
          feeToken: params.feeToken,
          computeUnitLimit: 600_000,
        },
      });

      setLastSignature(signature);
      await connection.confirmTransaction(signature, 'confirmed');

      return signature;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      console.error('Jupiter executeSwap error:', error);
      
      // Provide more helpful error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED') || error.message?.includes('NetworkError')) {
        throw new Error('Network error: Cannot connect to Jupiter API. Please check your internet connection and try again.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [isConnected, wallet, signAndSendTransaction, getQuote]);

  return {
    executeSwap,
    getQuote,
    loading,
    error,
    lastSignature,
  };
}

