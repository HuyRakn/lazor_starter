import { getStorage } from './storage';

const STORAGE_KEY = 'lazorkit-user-private-key';

/**
 * Gets the user's private key from storage
 *
 * @returns User's private key (base58 string) or null if not set
 */
export function getUserPrivateKey(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get private key from storage:', error);
    return null;
  }
}

/**
 * Saves the user's private key to storage
 *
 * @param privateKey - Base58 encoded private key
 * @returns Promise that resolves when save is complete
 */
export async function saveUserPrivateKey(privateKey: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, privateKey);
  } catch (error) {
    console.error('Failed to save private key to storage:', error);
    throw new Error('Failed to save private key');
  }
}

/**
 * Removes the user's private key from storage
 *
 * @returns Promise that resolves when removal is complete
 */
export async function removeUserPrivateKey(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove private key from storage:', error);
  }
}

/**
 * Checks if user has provided a private key
 *
 * @returns True if private key exists in storage
 */
export function hasUserPrivateKey(): boolean {
  return getUserPrivateKey() !== null;
}

