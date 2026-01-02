/**
 * NFT Utilities
 * 
 * Helper functions for minting regular NFTs and compressed NFTs with LazorKit Smart Wallets.
 */

import { PublicKey, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  MINT_SIZE,
} from '@solana/spl-token';

// Constants
export const NFT_NAME_MAX_LENGTH = 32;
export const NFT_DESCRIPTION_MAX_LENGTH = 200;

export interface NftMetadata {
  name: string;
  description: string;
}

export interface MintedRegularNft {
  mintAddress: string;
  name: string;
  description: string;
  signature: string;
}

export interface MintedCNft {
  assetId: string;
  treeAddress: string;
  name: string;
  description: string;
  signature: string;
}

/**
 * Validates NFT metadata
 * @param {string} name - NFT name
 * @param {string} description - NFT description
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateNftMetadata(name: string, description: string): {
  valid: boolean;
  error?: string;
} {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Name is required' };
  }
  if (name.trim().length > NFT_NAME_MAX_LENGTH) {
    return { valid: false, error: `Name must be ${NFT_NAME_MAX_LENGTH} characters or less` };
  }
  if (!description || description.trim().length === 0) {
    return { valid: false, error: 'Description is required' };
  }
  if (description.trim().length > NFT_DESCRIPTION_MAX_LENGTH) {
    return { valid: false, error: `Description must be ${NFT_DESCRIPTION_MAX_LENGTH} characters or less` };
  }
  return { valid: true };
}

/**
 * Generates a unique mint ID
 * @param {string} [prefix='nft'] - Prefix for the mint ID
 * @returns {string} Unique mint ID
 */
export function generateMintId(prefix: string = 'nft'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Adds smart wallet to instructions for LazorKit validation
 * LazorKit requires the smart wallet to be in all instruction account keys
 * @param {TransactionInstruction[]} instructions - Transaction instructions to modify
 * @param {string} smartWalletAddress - Smart wallet PDA address
 * @returns {void}
 */
export function addSmartWalletToInstructions(
  instructions: TransactionInstruction[],
  smartWalletAddress: string
): void {
  const walletPubkey = new PublicKey(smartWalletAddress);

  instructions.forEach((ix) => {
    const hasSmartWallet = ix.keys.some(k => k.pubkey.toBase58() === smartWalletAddress);
    if (!hasSmartWallet) {
      ix.keys.push({ pubkey: walletPubkey, isSigner: false, isWritable: false });
    }
  });
}

/**
 * Builds instructions for creating a regular NFT mint account
 * @param {string} walletAddress - Wallet address
 * @param {string} mintSeed - Seed for deterministic mint address
 * @returns {Promise<{mintPubkey: PublicKey, instructions: TransactionInstruction[], associatedTokenAddress: PublicKey}>} Mint instructions
 */
export async function buildRegularNftMintInstructions(
  walletAddress: string,
  mintSeed: string
): Promise<{
  mintPubkey: PublicKey;
  instructions: TransactionInstruction[];
  associatedTokenAddress: PublicKey;
}> {
  const walletPubkey = new PublicKey(walletAddress);
  
  // Derive mint address deterministically
  const mintPubkey = await PublicKey.createWithSeed(
    walletPubkey,
    mintSeed,
    TOKEN_PROGRAM_ID
  );

  // Get rent exemption
  const { getConnection } = await import('./solana');
  const connection = getConnection();
  const lamports = await connection.getMinimumBalanceForRentExemption(MINT_SIZE);

  // Derive ATA
  const associatedTokenAddress = await getAssociatedTokenAddress(
    mintPubkey,
    walletPubkey,
    true // allowOwnerOffCurve for PDA
  );

  const instructions: TransactionInstruction[] = [];

  // 1. Create mint account
  instructions.push(
    SystemProgram.createAccountWithSeed({
      fromPubkey: walletPubkey,
      basePubkey: walletPubkey,
      seed: mintSeed,
      newAccountPubkey: mintPubkey,
      lamports,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    })
  );

  // 2. Initialize mint (0 decimals for NFT)
  instructions.push(
    createInitializeMintInstruction(
      mintPubkey,
      0,
      walletPubkey,
      walletPubkey
    )
  );

  // 3. Create associated token account
  instructions.push(
    createAssociatedTokenAccountInstruction(
      walletPubkey,
      associatedTokenAddress,
      walletPubkey,
      mintPubkey
    )
  );

  // 4. Mint 1 token
  instructions.push(
    createMintToInstruction(
      mintPubkey,
      associatedTokenAddress,
      walletPubkey,
      1
    )
  );

  return {
    mintPubkey,
    instructions,
    associatedTokenAddress,
  };
}

