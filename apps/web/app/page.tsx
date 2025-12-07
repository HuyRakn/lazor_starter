'use client';

import { useLazorAuth } from '@lazor-starter/core';
import { Button, Card, CardContent, CardHeader, CardTitle, Alert, AlertDescription } from '@lazor-starter/ui';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const {
    isLoggedIn,
    pubkey,
    registerNewWallet,
    loginWithPasskey,
    createSmartWallet,
    logout,
    isInitialized,
  } = useLazorAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wait for storage initialization before rendering
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

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
        // Already logged in, go to dashboard
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
    router.push('/');
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-4xl font-bold text-white text-center">Welcome Back!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400 font-mono text-sm text-center">
              Wallet: {pubkey?.slice(0, 8)}...{pubkey?.slice(-8)}
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => router.push('/dashboard')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-5xl font-extrabold mb-2">
            <span className="text-white">Lazor</span>
            <span className="text-green-500">Starter</span>
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Universal Lazorkit SDK Starter
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {loading ? 'Connecting...' : 'Login with Passkey'}
          </Button>

          {error && (
            <Alert variant="destructive" className="bg-red-900/50 border-red-500">
              <AlertDescription className="text-red-200 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <p className="text-gray-500 text-xs text-center">
            Click to create your wallet with Face ID / Touch ID
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
