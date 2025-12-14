import { PublicKey } from '@solana/web3.js';

/**
 * Validates whether a string is a valid Solana public key
 *
 * @param address - Candidate base58 address
 * @returns true if valid, false otherwise
 */
export function validateAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  try {
    // eslint-disable-next-line no-new
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if provided value is a valid public key (alias)
 *
 * @param key - Candidate base58 address
 * @returns true if valid, false otherwise
 */
export function isValidPublicKey(key: string | null | undefined): boolean {
  return validateAddress(key);
}

/**
 * Builds Solana explorer URL for a given address
 *
 * @param address - Base58 address
 * @param cluster - Network cluster (devnet | mainnet)
 * @returns Explorer URL string
 */
export function getExplorerUrl(address: string, cluster: 'devnet' | 'mainnet' = 'devnet'): string {
  const base = cluster === 'mainnet' ? 'https://explorer.solana.com' : 'https://explorer.solana.com';
  const suffix = cluster === 'mainnet' ? '' : '?cluster=devnet';
  return `${base}/address/${address}${suffix}`;
}


