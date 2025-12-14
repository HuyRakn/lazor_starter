import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useLazorAuth, saveUserPrivateKey, getUserPrivateKey } from '@lazor-starter/core';
import { Button, Card, CardContent, CardHeader, CardTitle, Text, Alert, AlertDescription, Input, Label } from '@lazor-starter/ui';
import { AlertCircle } from 'lucide-react-native';
import React, { useState, useEffect } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, pubkey, registerNewWallet, logout, isInitialized } = useLazorAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);

  // Load saved private key on mount
  useEffect(() => {
    const savedKey = getUserPrivateKey();
    if (savedKey) {
      setPrivateKey(savedKey);
    }
  }, []);

  // Debug logs
  React.useEffect(() => {
    console.log('HomeScreen render:', { isInitialized, isLoggedIn, pubkey });
  }, [isInitialized, isLoggedIn, pubkey]);

  // Wait for storage initialization before rendering
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text style={{ color: '#9CA3AF', fontSize: 16 }}>Loading...</Text>
      </View>
    );
  }

  /**
   * Saves user's private key to storage
   *
   * @returns Promise that resolves when save is complete
   */
  const handleSavePrivateKey = async () => {
    if (!privateKey.trim()) {
      setError('Please enter your private key');
      return;
    }

    try {
      await saveUserPrivateKey(privateKey.trim());
      setShowPrivateKeyInput(false);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to save private key');
    }
  };

  /**
   * Handles login/registration flow
   *
   * @returns Promise that resolves when login completes
   */
  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      if (!isLoggedIn) {
        // Check if private key is provided
        const savedKey = getUserPrivateKey();
        if (!savedKey && !privateKey.trim()) {
          setError('Please provide your private key to create a wallet. This is required for testing on devnet.');
          setShowPrivateKeyInput(true);
          setLoading(false);
          return;
        }

        // Save private key if provided
        if (privateKey.trim() && !savedKey) {
          await saveUserPrivateKey(privateKey.trim());
        }

        // Register new wallet (create passkey + smart wallet onchain)
        const { walletAddress } = await registerNewWallet();
        console.log('Wallet created onchain:', walletAddress);
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      console.error('Login failed:', e);
      const errorMessage = e?.message || 'Login failed';
      
      // Check if error indicates missing private key
      if (errorMessage.includes('PRIVATE_KEY') || errorMessage.includes('private key') || e?.requiresPrivateKey) {
        setError('Please provide your private key to create a wallet. This is required for testing on devnet.');
        setShowPrivateKeyInput(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 16 }}>
              Welcome Back!
            </Text>
            <Text style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: 12, textAlign: 'center', marginBottom: 24 }}>
              Wallet: {pubkey?.slice(0, 8)}...{pubkey?.slice(-8)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <Button
              onPress={() => router.push('/dashboard')}
              className="flex-1 bg-green-600"
            >
              <Text>Go to Dashboard</Text>
            </Button>
            <Button
              onPress={handleLogout}
              variant="outline"
              className="flex-1 bg-gray-600 border-gray-500"
            >
              <Text>Logout</Text>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>
            <Text style={{ color: '#FFFFFF' }}>Lazor</Text>
            <Text style={{ color: '#10B981' }}>Starter</Text>
          </Text>
          <Text style={styles.subtitle}>Universal Lazorkit SDK Starter</Text>
        </View>
        <View style={styles.cardContent}>
          {(showPrivateKeyInput || error?.includes('private key')) && (
            <View style={{ gap: 8, marginBottom: 16 }}>
              <Label className="text-gray-400 text-sm">Private Key (for testing)</Label>
              <Input
                value={privateKey}
                onChangeText={setPrivateKey}
                placeholder="Enter your Solana private key (base58)"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                className="bg-gray-800 border-gray-700 text-white font-mono text-xs"
              />
              <Text style={{ color: '#6B7280', fontSize: 10 }}>
                Your private key is stored locally and only used to pay for wallet creation fees on devnet.
              </Text>
              <Button
                onPress={handleSavePrivateKey}
                disabled={!privateKey.trim()}
                className="w-full bg-blue-600"
                size="sm"
              >
                <Text>Save Private Key</Text>
              </Button>
            </View>
          )}

          <Button
            onPress={handleLogin}
            disabled={loading}
            className="w-full bg-green-600"
            size="lg"
          >
            <Text>{loading ? 'Connecting...' : 'Login with Passkey'}</Text>
          </Button>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!showPrivateKeyInput && !error && (
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
  errorContainer: {
    backgroundColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
  },
  hintText: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
  },
});

