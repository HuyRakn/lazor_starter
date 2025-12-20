// Polyfills are already imported in index.js before expo-router/entry
import { Stack } from 'expo-router';
import { LazorKitProvider } from '@lazorkit/wallet-mobile-adapter';
import { initMobileStorage, useNetworkStore } from '@lazor-starter/core';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// CRITICAL: Initialize AsyncStorage for localStorage polyfill
// This must be done before any other code that uses localStorage
if (typeof (global as any).__setAsyncStorageForLocalStorage === 'function') {
  (global as any).__setAsyncStorageForLocalStorage(AsyncStorage);
  
  // Pre-load existing data from AsyncStorage into in-memory cache
  // This makes localStorage.getItem() synchronous for already-loaded keys
  AsyncStorage.getAllKeys().then((keys) => {
    return Promise.all(
      keys.map((key) =>
        AsyncStorage.getItem(key).then((value) => {
          if (value !== null && (global as any).localStorage) {
            // Pre-populate in-memory cache
            (global as any).localStorage._storage?.set(key, value);
          }
        })
      )
    );
  }).catch((e) => {
    console.warn('Failed to pre-load AsyncStorage data:', e);
  });
}

// Initialize mobile storage for our custom storage utility
initMobileStorage(AsyncStorage);

// Inject API base URL and RPC URLs for mobile (to avoid importing expo-constants in shared code)
const extra = Constants.expoConfig?.extra || {};
(global as any).__LAZOR_MOBILE_API_BASE__ = extra.apiBaseUrl || '';
(global as any).__LAZOR_MOBILE_RPC_URL_MAIN__ = extra.lazorkitRpcUrlMain || '';
(global as any).__LAZOR_MOBILE_RPC_URL_DEV__ = extra.lazorkitRpcUrlDev || '';
(global as any).__LAZOR_MOBILE_PAYMASTER_URL_MAIN__ = extra.lazorkitPaymasterUrlMain || '';
(global as any).__LAZOR_MOBILE_PAYMASTER_URL_DEV__ = extra.lazorkitPaymasterUrlDev || '';
(global as any).__LAZOR_MOBILE_PORTAL_URL__ = extra.lazorkitPortalUrl || '';

// Inject redirectUrl for mobile deep linking
const scheme = Constants.expoConfig?.scheme || 'lazor-starter';
(global as any).__LAZOR_MOBILE_REDIRECT_URL = `${scheme}://home`;

/**
 * Root layout component for the mobile app
 * 
 * Wraps the app with LazorKitProvider and sets up deep linking for portal callbacks.
 * Reads configuration from environment variables via Constants.expoConfig.extra.
 * 
 * @returns Root layout component
 */
export default function RootLayout() {
  const extra = Constants.expoConfig?.extra || {};
  const { network } = useNetworkStore();

  const rpcUrl =
    network === 'devnet'
      ? extra.lazorkitRpcUrlDev || process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL_DEVNET || ''
      : extra.lazorkitRpcUrlMain || process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL || '';

  const portalUrl = extra.lazorkitPortalUrl || process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL || '';

  const paymasterUrl =
    network === 'devnet'
      ? extra.lazorkitPaymasterUrlDev || process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL_DEVNET || ''
      : extra.lazorkitPaymasterUrlMain || process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL || '';

  if (!rpcUrl) {
    console.error('Missing NEXT_PUBLIC_LAZORKIT_RPC_URL. Please set it in .env.local');
  }
  if (!portalUrl) {
    console.error('Missing NEXT_PUBLIC_LAZORKIT_PORTAL_URL. Please set it in .env.local');
  }
  if (!paymasterUrl) {
    console.error('Missing NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL. Please set it in .env.local');
  }

  return (
    <LazorKitProvider
      rpcUrl={rpcUrl}
      portalUrl={portalUrl}
      configPaymaster={{
        paymasterUrl,
      }}
    >
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Lazor Starter' }} />
        <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      </Stack>
    </LazorKitProvider>
  );
}

