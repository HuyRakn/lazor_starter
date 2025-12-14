// Polyfills are already imported in index.js before expo-router/entry
import { Stack } from 'expo-router';
import { LazorProvider, initMobileStorage } from '@lazor-starter/core';
import { StatusBar } from 'expo-status-bar';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { PortalWebView } from '../src/components/PortalWebView';
import { webViewManager } from '../src/utils/webViewManager';
import { useMobilePasskey } from '../src/hooks/useMobilePasskey';

// Export mobile passkey hook factory to global so useLazorAuth can access it
// This allows useLazorAuth to call the hook when needed
(global as any).__useMobilePasskeyHook = useMobilePasskey;

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

// Inject API base URL for mobile (to avoid importing expo-constants in shared code)
const extra = Constants.expoConfig?.extra || {};
(global as any).__LAZOR_MOBILE_API_BASE__ = extra.apiBaseUrl || 'http://localhost:3001';

export default function RootLayout() {
  // Read env from Constants.expoConfig.extra or process.env
  const extra = Constants.expoConfig?.extra || {};
  const rpcUrl = extra.lazorkitRpcUrl || process.env.NEXT_PUBLIC_LAZORKIT_RPC_URL;
  const paymasterUrl = extra.lazorkitPaymasterUrl || process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER_URL;
  const ipfsUrl = extra.lazorkitPortalUrl || process.env.NEXT_PUBLIC_LAZORKIT_PORTAL_URL;

  // State for WebView modal
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  // Register WebViewManager callbacks and make it globally available
  useEffect(() => {
    webViewManager.registerCallbacks(setWebViewVisible, setWebViewUrl);
    // Make webViewManager globally available for polyfills
    (global as any).__webViewManager = webViewManager;
  }, []);

  // Handle deep linking for portal callbacks
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log('🔗 Deep link received:', event.url);
      
      // Try to extract message data from URL
      try {
        const url = new URL(event.url);
        const messageData = url.searchParams.get('data') || url.hash.substring(1);
        
        if (messageData) {
          // Forward message to WebViewManager
          webViewManager.handleMessage({ data: messageData, origin: url.origin });
        }
      } catch (e) {
        console.error('Failed to parse deep link:', e);
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleWebViewMessage = (message: any) => {
    console.log('📨 WebView message received:', message);
    webViewManager.handleMessage(message);
  };

  const handleWebViewClose = () => {
    console.log('🔒 WebView closed');
    webViewManager.close();
  };

  return (
    <LazorProvider rpcUrl={rpcUrl} paymasterUrl={paymasterUrl} ipfsUrl={ipfsUrl}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Lazor Starter',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="dashboard" 
          options={{ 
            title: 'Dashboard',
          }} 
        />
      </Stack>
      
      {/* WebView Modal for portal */}
      <PortalWebView
        visible={webViewVisible}
        url={webViewUrl}
        onMessage={handleWebViewMessage}
        onClose={handleWebViewClose}
      />
    </LazorProvider>
  );
}

