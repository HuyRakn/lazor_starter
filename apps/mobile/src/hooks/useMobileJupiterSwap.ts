import { useState, useCallback } from 'react';
import { VersionedTransaction, Transaction, PublicKey } from '@solana/web3.js';
import { useMobileAuth } from './useMobileAuth';
import { useMobileGaslessTx } from './useMobileGaslessTx';
import { useNetworkStore, getConnection } from '@lazor-starter/core'; // These are safe to import from core
import { Buffer } from 'buffer'; // React Native usually needs explicit Buffer import or polyfill

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

export interface UseMobileJupiterSwapReturn {
    executeSwap: (params: SwapParams) => Promise<string>;
    getQuote: (params: SwapParams) => Promise<SwapQuote | null>;
    loading: boolean;
    error: Error | null;
    lastSignature: string | null;
}

const JUPITER_API_URL = 'https://lite-api.jup.ag/swap/v1';

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

async function toRawAmount(amount: number, mint: string): Promise<string> {
    const decimals = await getTokenDecimals(mint);
    return Math.floor(amount * Math.pow(10, decimals)).toString();
}

export function useMobileJupiterSwap(): UseMobileJupiterSwapReturn {
    const { pubkey, isLoggedIn } = useMobileAuth();
    const { sendTransaction } = useMobileGaslessTx();
    const { network } = useNetworkStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [lastSignature, setLastSignature] = useState<string | null>(null);

    const getQuote = useCallback(async (params: SwapParams): Promise<SwapQuote | null> => {
        if (!isLoggedIn || !pubkey) {
            throw new Error('Wallet not connected');
        }

        if (network === 'devnet') {
            throw new Error('Jupiter Swap is only supported on Solana Mainnet Beta.');
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

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch quote: ${response.statusText}`);
            }

            const quote = await response.json();
            if (quote.error) throw new Error(quote.error);

            return quote;
        } catch (err: any) {
            setError(err);
            throw err;
        }
    }, [isLoggedIn, pubkey, network]);

    const executeSwap = useCallback(async (params: SwapParams): Promise<string> => {
        if (!isLoggedIn || !pubkey) {
            throw new Error('Wallet not connected');
        }

        if (network === 'devnet') {
            throw new Error('Jupiter Swap is only supported on Solana Mainnet Beta.');
        }

        setLoading(true);
        setError(null);

        try {
            const connection = getConnection();
            const quote = await getQuote(params);
            if (!quote) throw new Error('Failed to get quote');

            const latestBlockhash = await connection.getLatestBlockhash('finalized');

            const swapResponse = await fetch(`${JUPITER_API_URL}/swap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteResponse: quote,
                    userPublicKey: pubkey,
                    wrapAndUnwrapSol: true,
                    dynamicComputeUnitLimit: true,
                    prioritizationFeeLamports: 'auto',
                    recentBlockhash: latestBlockhash.blockhash,
                    asLegacyTransaction: true,
                }),
            });

            if (!swapResponse.ok) {
                throw new Error(`Failed to execute swap: ${swapResponse.statusText}`);
            }

            const swapData = await swapResponse.json();
            if (swapData.error) throw new Error(swapData.error);

            const swapTransactionBuf = Buffer.from(swapData.swapTransaction, 'base64');
            const transaction = Transaction.from(swapTransactionBuf);

            // Use useMobileGaslessTx to sign and send
            const signature = await sendTransaction(transaction.instructions, {
                computeUnitLimit: 600_000
            });

            setLastSignature(signature);
            return signature;
        } catch (err: any) {
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, pubkey, network, getQuote, sendTransaction]);

    return {
        executeSwap,
        getQuote,
        loading,
        error,
        lastSignature
    };
}
