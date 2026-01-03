/**
 * Jupiter Swap Integration Hook
 * 
 * @returns {UseJupiterSwapReturn} Swap methods and state
 */

import { useState, useCallback } from 'react';
import { VersionedTransaction, Transaction, PublicKey } from '@solana/web3.js';
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
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  feeToken?: string;
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

const JUPITER_API_URL = 'https://lite-api.jup.ag/swap/v1';

/**
 * @param {string} mint - Token mint address
 * @returns {Promise<number>} Token decimals
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
    if (mint === 'So11111111111111111111111111111111111111112') return 9;
    if (mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') return 6;
    return 6;
  } catch {
    return 6;
  }
}

/**
 * @param {number} amount - Human-readable amount
 * @param {string} mint - Token mint address
 * @returns {Promise<string>} Raw amount as string
 */
async function toRawAmount(amount: number, mint: string): Promise<string> {
  const decimals = await getTokenDecimals(mint);
  return Math.floor(amount * Math.pow(10, decimals)).toString();
}

export function useJupiterSwap(): UseJupiterSwapReturn {
  const { wallet, isConnected, signAndSendTransaction } = useSmartWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  /**
   * @param {SwapParams} params - Swap parameters
   * @returns {Promise<SwapQuote | null>} Swap quote or null
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
          if (errorText && errorText.trim().startsWith('{')) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
          } else {
            errorMessage = errorText || errorMessage;
          }
        } catch {
          // Ignore
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
      
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED') || error.message?.includes('NetworkError')) {
        throw new Error('Network error: Cannot connect to Jupiter API. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  }, [isConnected, wallet]);

  /**
   * @param {SwapParams} params - Swap parameters
   * @returns {Promise<string>} Transaction signature
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
      
      const latestBlockhash = await connection.getLatestBlockhash('finalized');
      
      const swapUrl = `${JUPITER_API_URL}/swap`;
      console.log('Jupiter Swap Request:', swapUrl);
      
      const swapResponse = await fetch(swapUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: wallet.smartWallet,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
          recentBlockhash: latestBlockhash.blockhash,
          asLegacyTransaction: true,
        }),
      });

      if (!swapResponse.ok) {
        let errorMessage = `Failed to execute swap: ${swapResponse.status} ${swapResponse.statusText}`;
        try {
          const errorText = await swapResponse.text();
          if (errorText && errorText.trim().startsWith('{')) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              errorMessage = errorText || errorMessage;
            }
          } else {
            errorMessage = errorText || errorMessage;
          }
        } catch {
          // Ignore
        }
        console.error('Jupiter executeSwap API error:', errorMessage, swapResponse.status, swapResponse.statusText);
        throw new Error(errorMessage);
      }

      const swapData = await swapResponse.json();

      if (swapData.error) {
        console.error('Jupiter executeSwap response error:', swapData.error);
        throw new Error(swapData.error);
      }

      if (!swapData.swapTransaction) {
        console.error('Jupiter executeSwap: Invalid response - missing swapTransaction', swapData);
        throw new Error('Invalid swap response from Jupiter API');
      }

      const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
      
      let instructions: any[];
      
      try {
        const versionedTransaction = VersionedTransaction.deserialize(swapTransactionBuf);
        const message = versionedTransaction.message;
        const staticKeys = message.staticAccountKeys;
        const addressTableLookups = message.addressTableLookups || [];
        
        console.log('Jupiter transaction details (Versioned):', {
          staticKeysCount: staticKeys.length,
          addressTableLookupsCount: addressTableLookups.length,
          compiledInstructionsCount: message.compiledInstructions.length,
        });
        
        const allAccountKeys: PublicKey[] = [...staticKeys];
        
        for (const lookup of addressTableLookups) {
          let resolved = false;
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const lookupTableAccount = await connection.getAddressLookupTable(lookup.accountKey, {
                commitment: attempt === 0 ? 'confirmed' : 'finalized',
              });
              if (lookupTableAccount.value) {
                const addresses = lookupTableAccount.value.state.addresses;
                const writableKeys = lookup.writableIndexes.map(idx => {
                  if (idx >= addresses.length) {
                    throw new Error(`ALT index ${idx} out of bounds (max: ${addresses.length - 1})`);
                  }
                  return addresses[idx];
                });
                const readonlyKeys = lookup.readonlyIndexes.map(idx => {
                  if (idx >= addresses.length) {
                    throw new Error(`ALT index ${idx} out of bounds (max: ${addresses.length - 1})`);
                  }
                  return addresses[idx];
                });
                allAccountKeys.push(...writableKeys, ...readonlyKeys);
                console.log('Resolved ALT:', {
                  lookupTable: lookup.accountKey.toBase58(),
                  writableCount: writableKeys.length,
                  readonlyCount: readonlyKeys.length,
                  totalKeys: allAccountKeys.length,
                  attempt: attempt + 1,
                });
                resolved = true;
                break;
              }
            } catch (err) {
              if (attempt === 2) {
                console.error('Failed to resolve address lookup table after 3 attempts:', lookup.accountKey.toBase58(), err);
                throw new Error(`Failed to resolve address lookup table: ${lookup.accountKey.toBase58()}. This is required for the swap transaction. ${err instanceof Error ? err.message : String(err)}`);
              }
              await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
            }
          }
          if (!resolved) {
            throw new Error(`Address lookup table not found: ${lookup.accountKey.toBase58()}`);
          }
        }
        
        instructions = message.compiledInstructions
          .map(ix => {
            if (ix.programIdIndex >= allAccountKeys.length) {
              console.error('Skipping instruction - Invalid programIdIndex:', {
                programIdIndex: ix.programIdIndex,
                allAccountKeysLength: allAccountKeys.length,
                staticKeysLength: staticKeys.length,
                addressTableLookupsCount: addressTableLookups.length,
              });
              return null;
            }
            
            const programId = allAccountKeys[ix.programIdIndex];
            const keys = ix.accountKeyIndexes
              .map(keyIndex => {
                if (keyIndex >= allAccountKeys.length) {
                  console.error('Skipping key - Invalid account key index:', {
                    keyIndex,
                    allAccountKeysLength: allAccountKeys.length,
                    staticKeysLength: staticKeys.length,
                    addressTableLookupsCount: addressTableLookups.length,
                  });
                  return null;
                }
                
                const pubkey = allAccountKeys[keyIndex];
                if (!pubkey) {
                  console.error('Skipping key - Missing pubkey at index:', keyIndex);
                  return null;
                }
                
                const isSigner = keyIndex < message.header.numRequiredSignatures;
                const baseWritableIndex = message.header.numRequiredSignatures - message.header.numReadonlySignedAccounts;
                const isWritable = 
                  (keyIndex < baseWritableIndex) ||
                  (keyIndex >= message.header.numRequiredSignatures &&
                   keyIndex < allAccountKeys.length - message.header.numReadonlyUnsignedAccounts);
                
                return {
                  pubkey,
                  isSigner,
                  isWritable: isWritable ?? false,
                };
              })
              .filter((key): key is { pubkey: PublicKey; isSigner: boolean; isWritable: boolean } => key !== null);
            
            if (keys.length === 0) {
              console.error('Skipping instruction - No valid keys');
              return null;
            }
            
            return {
              programId,
              keys,
              data: Buffer.from(ix.data),
            };
          })
          .filter((ix): ix is { programId: PublicKey; keys: Array<{ pubkey: PublicKey; isSigner: boolean; isWritable: boolean }>; data: Buffer } => ix !== null);
        
        if (instructions.length === 0) {
          throw new Error('No valid instructions found after extracting from Jupiter transaction');
        }
        
        console.log('Extracted instructions:', {
          originalCount: message.compiledInstructions.length,
          extractedCount: instructions.length,
        });
      } catch (versionedError) {
        console.log('Failed to parse as VersionedTransaction, trying LegacyTransaction:', versionedError);
        try {
          const legacyTransaction = Transaction.from(swapTransactionBuf);
          instructions = legacyTransaction.instructions;
          console.log('Jupiter transaction details (Legacy):', {
            instructionsCount: instructions.length,
          });
        } catch (legacyError) {
          throw new Error(`Failed to parse Jupiter transaction: ${legacyError instanceof Error ? legacyError.message : String(legacyError)}`);
        }
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

