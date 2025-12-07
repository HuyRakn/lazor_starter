import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useLazorAuth } from '@lazor-starter/core';
import { Button, Card, CardContent, CardHeader, CardTitle, Text, Alert, AlertDescription } from '@lazor-starter/ui';
import { AlertCircle } from 'lucide-react-native';
import { useState } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const { isLoggedIn, pubkey, registerNewWallet, logout, isInitialized } = useLazorAuth();
  const [loading, setLoading] = useState(false);

  // Wait for storage initialization before rendering
  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <Text className="text-gray-400">Loading...</Text>
      </View>
    );
  }

  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      if (!isLoggedIn) {
        // Register new wallet (create passkey + smart wallet onchain)
        const { walletAddress } = await registerNewWallet();
        console.log('Wallet created onchain:', walletAddress);
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (e: any) {
      console.error('Login failed:', e);
      setError(e?.message || 'Login failed');
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
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-white text-center">Welcome Back!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Text className="text-gray-400 font-mono text-sm text-center">
              Wallet: {pubkey?.slice(0, 8)}...{pubkey?.slice(-8)}
            </Text>
            <View className="flex-row gap-4">
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
          </CardContent>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="items-center">
          <CardTitle className="text-5xl font-extrabold mb-2">
            <Text className="text-white">Lazor</Text>
            <Text className="text-green-500">Starter</Text>
          </CardTitle>
          <Text className="text-gray-400 text-sm">Universal Lazorkit SDK Starter</Text>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onPress={handleLogin}
            disabled={loading}
            className="w-full bg-green-600"
            size="lg"
          >
            <Text>{loading ? 'Connecting...' : 'Login with Passkey'}</Text>
          </Button>

          {error && (
            <Alert variant="destructive" icon={AlertCircle} className="bg-red-900/50 border-red-500">
              <AlertDescription className="text-red-200 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Text className="text-gray-500 text-xs text-center">
            Click to create your wallet with Face ID / Touch ID
          </Text>
        </CardContent>
      </Card>
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
});
