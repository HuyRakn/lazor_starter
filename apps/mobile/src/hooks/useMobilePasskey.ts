/**
 * Mobile-specific passkey implementation using native APIs
 * This bypasses the portal WebView flow and uses expo-local-authentication directly
 */

import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import type { PasskeyData } from '@lazor-starter/core';

// Generate a random user ID for this device
function generateUserId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate a mock credential ID (in real implementation, this would come from native API)
function generateCredentialId(): string {
  const array = new Uint8Array(64);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for React Native
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate a mock public key (in real implementation, this would come from native API)
function generatePublicKey(): { x: string; y: string } {
  // Generate mock EC public key coordinates
  const x = Array.from(new Uint8Array(32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const y = Array.from(new Uint8Array(32))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { x, y };
}

export function useMobilePasskey() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  // Check if biometric authentication is available
  const checkAvailability = useCallback(async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsAvailable(compatible && enrolled);
      return compatible && enrolled;
    } catch (e) {
      console.error('Failed to check biometric availability:', e);
      setIsAvailable(false);
      return false;
    }
  }, []);

  /**
   * Creates a passkey using native biometric authentication
   * 
   * @returns Promise resolving to passkey data
   * @throws Error if biometric authentication is not available or user cancels
   */
  const createPasskey = useCallback(async (): Promise<PasskeyData> => {
    try {
      // Check availability first
      const available = await checkAvailability();
      if (!available) {
        throw new Error('Biometric authentication is not available on this device');
      }

      // Authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Create your wallet with Face ID / Touch ID',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
        fallbackLabel: 'Use passcode',
      });

      if (!result.success) {
        throw new Error('Biometric authentication was cancelled or failed');
      }

      // Generate passkey data (mock for now, in production this would use actual native passkey API)
      const userId = generateUserId();
      const credentialId = generateCredentialId();
      const publicKey = generatePublicKey();

      const passkeyData: PasskeyData = {
        credentialId,
        userId,
        publicKey,
      };

      console.log('✅ Mobile passkey created successfully');
      return passkeyData;
    } catch (error: any) {
      console.error('❌ Failed to create mobile passkey:', error);
      throw error;
    }
  }, [checkAvailability]);

  /**
   * Authenticates with an existing passkey using biometric authentication
   * 
   * @returns Promise resolving to stored passkey data
   * @throws Error if biometric authentication fails or no passkey data is found
   */
  const authenticatePasskey = useCallback(async (): Promise<PasskeyData> => {
    try {
      const available = await checkAvailability();
      if (!available) {
        throw new Error('Biometric authentication is not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with Face ID / Touch ID',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        throw new Error('Biometric authentication was cancelled or failed');
      }

      // In a real implementation, we would retrieve the stored passkey data here
      // For now, we'll need to get it from storage
      const { getStorage } = require('@lazor-starter/core');
      const storage = getStorage();
      if (!storage) {
        throw new Error('Storage not available');
      }

      const passkeyDataString = await Promise.resolve(
        storage.getItem('lazorkit-passkey-data')
      );
      if (!passkeyDataString) {
        throw new Error('No passkey data found. Please create a new wallet.');
      }

      const passkeyData = JSON.parse(passkeyDataString) as PasskeyData;
      console.log('✅ Mobile passkey authenticated successfully');
      return passkeyData;
    } catch (error: any) {
      console.error('❌ Failed to authenticate mobile passkey:', error);
      throw error;
    }
  }, [checkAvailability]);

  return {
    isAvailable,
    checkAvailability,
    createPasskey,
    authenticatePasskey,
  };
}

