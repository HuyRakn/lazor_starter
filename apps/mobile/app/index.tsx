import { View, StyleSheet } from 'react-native';
import { AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
  useNetworkStore,
  formatAddress,
} from '@lazor-starter/core';
import { useMobileAuth } from '../src/hooks/useMobileAuth';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Text,
} from '@lazor-starter/ui';
import React, { useState, useEffect } from 'react';

/**
 * Home screen component for mobile app
 * 
 * Displays login form with network selector (mainnet/devnet).
 * After successful login, redirects to dashboard.
 * 
 * @returns Home screen component
 */
export default function HomeScreen() {
  const router = useRouter();
  const {
    isLoggedIn,
    pubkey,
    registerNewWallet,
    logout,
    isInitialized,
  } = useMobileAuth();
  const { network, setNetwork } = useNetworkStore();
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  /**
   * Formats error messages to be more user-friendly
   *
   * Parses JSON error responses and extracts meaningful messages.
   * Handles rate limit errors, network errors, and generic errors.
   *
   * @param error - The error object or string to format
   * @returns Formatted error message string
   */
  const formatErrorMessage = (error: any): string => {
    if (!error) return 'An unknown error occurred';

    const errorMessage =
      error?.message || error?.toString() || 'An unknown error occurred';

    try {
      const jsonMatch = errorMessage.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.error?.message) {
          return parsed.error.message;
        }
      }

      if (errorMessage.toLowerCase().includes('rate limit')) {
        return 'Rate limit exceeded. The devnet faucet has a limit of 1 SOL per project per day. Please try again later.';
      }

      if (errorMessage.includes('403')) {
        return 'Request denied. You may have exceeded the rate limit. Please try again later.';
      }

      if (
        errorMessage.includes('timeout') ||
        errorMessage.includes('timed out')
      ) {
        return 'Request timed out. Please check your connection and try again.';
    }

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
      }
    } catch {
      // If parsing fails, return the original message
    }

    return errorMessage;
  };

  /**
   * Handles login/registration flow
   *
   * Uses the currently selected network from useNetworkStore.
   * Default network is mainnet, but user can switch to devnet before logging in.
   *
   * @returns Promise that resolves when login completes
   */
  const handleLogin = async () => {
    if (loginLoading) return;
    setLoginLoading(true);
    setLoginError(null);

    try {
        const { walletAddress } = await registerNewWallet();
      console.log('Wallet created:', walletAddress);
        router.push('/dashboard');
    } catch (e: any) {
      const errorMessage = e?.message || 'Login failed';
      setLoginError(errorMessage);
    } finally {
      setLoginLoading(false);
    }
  };

  /**
   * Handles logout action
   *
   * Logs out user and clears session.
   * Resets network to mainnet for next login.
   *
   * @returns void
   */
  const handleLogout = () => {
    logout();
    setLoginError(null);
    setNetwork('mainnet');
    router.replace('/');
  };

  // Redirect to dashboard when already logged in (avoid rendering redirects)
  useEffect(() => {
    if (isInitialized && isLoggedIn && pubkey) {
      router.replace('/dashboard');
    }
  }, [isInitialized, isLoggedIn, pubkey, router]);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>
            <Text style={{ color: '#FFFFFF' }}>Lazor</Text>
            <Text style={{ color: '#7857ff' }}>Starter</Text>
          </Text>
          <Text style={styles.subtitle}>
            Universal Lazorkit SDK Starter
          </Text>
        </View>
        <View style={styles.cardContent}>
          {/* Network selector */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#9CA3AF' }}>
              Network
            </Text>
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: '#111827',
                borderRadius: 9999,
                padding: 4,
                borderWidth: 1,
                borderColor: '#374151',
              }}
            >
              <Button
                {...({ onPress: () => setNetwork('mainnet') } as any)}
                style={{
                  backgroundColor: network === 'mainnet' ? '#FFFFFF' : 'transparent',
                  borderRadius: 9999,
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: network === 'mainnet' ? '#000000' : '#9CA3AF',
                    fontWeight: network === 'mainnet' ? '600' : '400',
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 12,
                    paddingRight: 12,
                  }}
                >
                  MAIN
              </Text>
              </Button>
              <Button
                {...({ onPress: () => setNetwork('devnet') } as any)}
                style={{
                  backgroundColor: network === 'devnet' ? '#7857ff' : 'transparent',
                  borderRadius: 9999,
                  paddingHorizontal: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: network === 'devnet' ? '#FFFFFF' : '#9CA3AF',
                    fontWeight: network === 'devnet' ? '600' : '400',
                    paddingTop: 6,
                    paddingBottom: 6,
                    paddingLeft: 12,
                    paddingRight: 12,
                  }}
                >
                  DEV
                </Text>
              </Button>
            </View>
          </View>

          <Button
            {...({ onPress: handleLogin } as any)}
            disabled={loginLoading}
            style={{
              backgroundColor: '#7857ff',
              borderRadius: 20,
              paddingVertical: 14,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: loginLoading ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: 16,
                fontWeight: '600',
              }}
            >
              {loginLoading ? 'Connecting...' : 'Login with Passkey'}
            </Text>
          </Button>

          {loginError && (
            <View
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderWidth: 1,
                borderColor: '#EF4444',
                borderRadius: 12,
                padding: 12,
                marginTop: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <AlertCircle size={16} color="#FCA5A5" />
                <Text style={{ color: '#FCA5A5', fontSize: 14, flex: 1 }}>
                  {formatErrorMessage(loginError)}
                </Text>
              </View>
            </View>
          )}

          {!loginError && (
            <Text style={styles.hintText}>
              Click to create your wallet with Face ID / Touch ID
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
    padding: 24,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  cardContent: {
    gap: 16,
  },
  hintText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});
