/**
 * Solana Utilities
 * 
 * Shared functions for Solana operations across Web and Mobile platforms.
 * Provides connection management, balance fetching, and transaction utilities.
 */

import { Connection, PublicKey, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { useNetworkStore } from '../state/networkStore';

// Buffer polyfill
let Buffer: any;
if (typeof window !== 'undefined' && (window as any).Buffer) {
  Buffer = (window as any).Buffer;
} else if (typeof global !== 'undefined' && (global as any).Buffer) {
  Buffer = (global as any).Buffer;
} else {
  try {
    Buffer = require('buffer').Buffer;
  } catch {
    // Buffer will be undefined, functions will need to handle this
  }
}

// Cached connection instances
const connectionCache: Map<string, Connection> = new Map();

/**
 * Gets or creates a cached Solana connection instance
 * @param {string} [rpcUrl] - Optional RPC URL (uses network store if not provided)
 * @returns {Connection} Solana connection instance
 */
export function getConnection(rpcUrl?: string): Connection {
  const network = useNetworkStore.getState().network;
  const isDevnet = network === 'devnet';
  
  const finalRpcUrl = rpcUrl || (
    isDevnet
      ? process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET || 
        process.env.EXPO_PUBLIC_LAZORKIT_RPC_URL_DEVNET ||
        'https://api.devnet.solana.com'
      : process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL ||
        process.env.EXPO_PUBLIC_LAZORKIT_RPC_URL ||
        'https://api.mainnet-beta.solana.com'
  );

  if (!connectionCache.has(finalRpcUrl)) {
    connectionCache.set(finalRpcUrl, new Connection(finalRpcUrl, 'confirmed'));
  }

  return connectionCache.get(finalRpcUrl)!;
}

/**
 * Gets SOL balance for a wallet address
 * @param {Connection} connection - Solana connection instance
 * @param {PublicKey} publicKey - Wallet public key
 * @returns {Promise<number>} SOL balance in human-readable format
 */
export async function getSolBalance(
  connection: Connection,
  publicKey: PublicKey
): Promise<number> {
  const lamports = await connection.getBalance(publicKey);
  return lamports / LAMPORTS_PER_SOL;
}

/**
 * Gets USDC balance for a wallet address
 * @param {Connection} connection - Solana connection instance
 * @param {PublicKey} publicKey - Wallet public key
 * @param {string} [usdcMint] - USDC mint address (default: devnet USDC)
 * @returns {Promise<number>} USDC balance in human-readable format
 */
export async function getUsdcBalance(
  connection: Connection,
  publicKey: PublicKey,
  usdcMint: string = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' // Devnet USDC
): Promise<number> {
  try {
    const mintPubkey = new PublicKey(usdcMint);
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      mint: mintPubkey,
    });

    if (tokenAccounts.value.length === 0) {
      return 0;
    }

    const balance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
    return balance || 0;
  } catch {
    return 0;
  }
}

/**
 * Gets both SOL and USDC balances for a wallet
 * @param {Connection} connection - Solana connection instance
 * @param {PublicKey} publicKey - Wallet public key
 * @param {string} [usdcMint] - USDC mint address
 * @returns {Promise<{sol: number, usdc: number}>} Object with sol and usdc balances
 */
export async function getBalances(
  connection: Connection,
  publicKey: PublicKey,
  usdcMint?: string
): Promise<{ sol: number; usdc: number }> {
  const [sol, usdc] = await Promise.all([
    getSolBalance(connection, publicKey),
    getUsdcBalance(connection, publicKey, usdcMint),
  ]);

  return { sol, usdc };
}

/**
 * Shortens a wallet address for display
 * @param {string} address - Full wallet address
 * @param {number} [chars=4] - Number of characters to show at start and end
 * @returns {string} Shortened address (e.g., "Abc...Xyz")
 */
export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Validates a Solana recipient address
 * @param {string} recipient - Recipient address to validate
 * @returns {{valid: boolean, address?: PublicKey, error?: string}} Validation result
 */
export function validateRecipientAddress(recipient: string): {
  valid: boolean;
  address?: PublicKey;
  error?: string;
} {
  if (!recipient || recipient.trim() === '') {
    return { valid: false, error: 'Recipient address is required' };
  }
  try {
    const address = new PublicKey(recipient);
    return { valid: true, address };
  } catch {
    return { valid: false, error: 'Invalid recipient address' };
  }
}

/**
 * Validates a transfer amount against available balance
 * @param {string} amount - Amount string to validate
 * @param {number | null} balance - Available balance (null if unknown)
 * @returns {{valid: boolean, amountNum?: number, error?: string}} Validation result
 */
export function validateTransferAmount(
  amount: string,
  balance: number | null
): { valid: boolean; amountNum?: number; error?: string } {
  const amountNum = parseFloat(amount);

  if (isNaN(amountNum) || amountNum <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (balance !== null && amountNum > balance) {
    return {
      valid: false,
      error: `Insufficient balance. You have ${balance.toFixed(2)} USDC`
    };
  }

  return { valid: true, amountNum };
}

/**
 * Creates a formatted success message for a transfer
 * @param {number} amount - Transfer amount
 * @param {string} recipient - Recipient address
 * @param {Object} [options] - Options
 * @param {boolean} [options.gasless] - Whether transaction was gasless
 * @returns {string} Formatted success message
 */
export function createTransferSuccessMessage(
  amount: number,
  recipient: string,
  options: { gasless?: boolean } = {}
): string {
  const baseMessage =
    `Transfer successful!\n\n` +
    `Sent: ${amount} USDC\n` +
    `To: ${shortenAddress(recipient, 8)}`;

  if (options.gasless) {
    return baseMessage + `\n\nNo gas fees paid!`;
  }

  return baseMessage;
}

/**
 * Builds instructions for a USDC transfer, including ATA creation if needed
 * @param {Connection} connection - Solana connection instance
 * @param {PublicKey} senderPubkey - Sender public key
 * @param {PublicKey} recipientPubkey - Recipient public key
 * @param {number} amount - Transfer amount in human-readable format
 * @param {PublicKey} [usdcMint] - USDC mint address (default: devnet USDC)
 * @returns {Promise<TransactionInstruction[]>} Array of transaction instructions
 */
export async function buildUsdcTransferInstructions(
  connection: Connection,
  senderPubkey: PublicKey,
  recipientPubkey: PublicKey,
  amount: number,
  usdcMint: PublicKey = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU') // Devnet USDC
): Promise<TransactionInstruction[]> {
  const { createTransferInstruction } = await import('@solana/spl-token');
  const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
  const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');

  const senderTokenAccount = getAssociatedTokenAddressSync(usdcMint, senderPubkey);
  const recipientTokenAccount = getAssociatedTokenAddressSync(usdcMint, recipientPubkey);

  const recipientAccountInfo = await connection.getAccountInfo(recipientTokenAccount);
  const instructions: TransactionInstruction[] = [];

  if (!recipientAccountInfo) {
    const createAccountIx = new TransactionInstruction({
      keys: [
        { pubkey: senderPubkey, isSigner: true, isWritable: true },
        { pubkey: recipientTokenAccount, isSigner: false, isWritable: true },
        { pubkey: recipientPubkey, isSigner: false, isWritable: false },
        { pubkey: usdcMint, isSigner: false, isWritable: false },
        { pubkey: new PublicKey('11111111111111111111111111111111'), isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: ASSOCIATED_TOKEN_PROGRAM_ID,
      data: Buffer.from([]),
    });
    instructions.push(createAccountIx);
  }

  const transferIx = createTransferInstruction(
    senderTokenAccount,
    recipientTokenAccount,
    senderPubkey,
    Math.floor(amount * 1_000_000),
    [],
    TOKEN_PROGRAM_ID
  );
  instructions.push(transferIx);

  return instructions;
}

/**
 * Derives Associated Token Account (ATA) address synchronously
 * @param {PublicKey} mint - Token mint address
 * @param {PublicKey} owner - Token account owner
 * @param {PublicKey} [programId] - Token program ID (default: SPL Token Program)
 * @param {PublicKey} [associatedTokenProgramId] - Associated Token Program ID
 * @returns {PublicKey} ATA public key
 */
export function getAssociatedTokenAddressSync(
  mint: PublicKey,
  owner: PublicKey,
  programId: PublicKey = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
  associatedTokenProgramId: PublicKey = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), programId.toBuffer(), mint.toBuffer()],
    associatedTokenProgramId
  );

  return address;
}

/**
 * @deprecated Use getAssociatedTokenAddressSync instead
 */
export const getAssociatedTokenAddress = getAssociatedTokenAddressSync;

// Common Solana/transaction error patterns and their user-friendly messages
const ERROR_PATTERNS: Array<{ pattern: RegExp | string; message: string }> = [
  { pattern: '0x1', message: 'Insufficient SOL for rent. Get SOL from a Solana Devnet faucet.' },
  { pattern: '0x1783', message: 'Insufficient funds for transfer. Check your USDC balance.' },
  { pattern: /Error processing Instruction.*0x1/i, message: 'Insufficient SOL for transaction fees. Get SOL from a faucet.' },
  { pattern: 'slippage', message: 'Slippage exceeded. Try again or increase slippage tolerance.' },
  { pattern: 'No liquidity', message: 'No liquidity pool found for this pair.' },
  { pattern: /transaction too large/i, message: 'Transaction too large. Try a simpler operation.' },
  { pattern: 'insufficient funds', message: 'Insufficient funds for this transaction.' },
  { pattern: 'blockhash not found', message: 'Transaction expired. Please try again.' },
  { pattern: 'already in use', message: 'Account already exists or is in use.' },
  { pattern: 'custom program error', message: 'Smart contract returned an error.' },
  { pattern: 'WalletSendTransactionError', message: 'Wallet rejected the transaction. Check your balance and try again.' },
];

/**
 * Parses a transaction error and returns a user-friendly message
 * @param {unknown} error - Error object or message
 * @returns {string} User-friendly error message
 */
export function parseTransactionError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);

  for (const { pattern, message } of ERROR_PATTERNS) {
    if (typeof pattern === 'string') {
      if (errorMessage.includes(pattern)) {
        return message;
      }
    } else if (pattern.test(errorMessage)) {
      return message;
    }
  }

  return errorMessage || 'Unknown error occurred';
}

/**
 * Formats a transaction error for display to user
 * @param {unknown} error - Error object or message
 * @param {string} [operation='Transaction'] - Operation name (e.g., "Swap", "Transfer")
 * @returns {string} Formatted error message
 */
export function formatTransactionError(error: unknown, operation = 'Transaction'): string {
  const userMessage = parseTransactionError(error);
  return `${operation} failed: ${userMessage}`;
}

/**
 * Executes a function with retry logic and exponential backoff
 * @template T
 * @param {() => Promise<T>} fn - Function to retry
 * @param {Object} [options] - Retry options
 * @param {number} [options.maxRetries=3] - Maximum number of retry attempts
 * @param {number} [options.initialDelayMs=1000] - Initial delay in milliseconds
 * @param {number} [options.maxDelayMs=10000] - Maximum delay in milliseconds
 * @param {(attempt: number, error: unknown) => void} [options.onRetry] - Callback on retry
 * @returns {Promise<T>} Result of function execution
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(initialDelayMs * Math.pow(2, attempt - 1), maxDelayMs);

      if (onRetry) {
        onRetry(attempt, error);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

