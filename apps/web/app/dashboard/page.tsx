'use client';

import { useLazorAuth, useGaslessTx } from '@lazor-starter/core';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Alert, AlertDescription } from '@lazor-starter/ui';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { pubkey, logout, isInitialized } = useLazorAuth();
  const { transferSOL, transferSPLToken } = useGaslessTx();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect to home if not logged in (useEffect to avoid setState during render)
  useEffect(() => {
    if (isInitialized && !pubkey) {
      router.push('/');
    }
  }, [isInitialized, pubkey, router]);

  // Wait for storage initialization before checking auth
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  // Don't render if not logged in (after initialization)
  if (!pubkey) {
    return null;
  }

  const handleTransferSOL = async () => {
    if (!recipient || !amount) {
      setError('Please enter recipient and amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Invalid amount');
      }

      // CRITICAL: Real onchain transaction on devnet (gasless via Paymaster)
      // This is 100% onchain - no mocks, no fake data
      const signature = await transferSOL(recipient, amountNum);
      setSuccess(`Transaction sent! Signature: ${signature.slice(0, 16)}...`);
      setRecipient('');
      setAmount('');
    } catch (e: any) {
      console.error('Transfer failed:', e);
      setError(e?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
          >
            Logout
          </Button>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-sm text-gray-400">Wallet Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-white font-mono text-sm break-all">{pubkey}</p>
            <a
              href={`https://explorer.solana.com/address/${pubkey}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 text-xs hover:underline inline-block"
            >
              View on Solana Explorer →
            </a>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-white">Transfer SOL (Gasless)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-400">Recipient Address</Label>
              <Input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter Solana address"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Amount (SOL)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                step="0.001"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-green-500"
              />
            </div>

            <Button
              onClick={handleTransferSOL}
              disabled={loading || !recipient || !amount}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Sending...' : 'Send SOL (Gasless)'}
            </Button>

            {error && (
              <Alert variant="destructive" className="bg-red-900/50 border-red-500">
                <AlertDescription className="text-red-200 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-900/50 border-green-500">
                <AlertDescription className="text-green-200 text-sm">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Alert className="bg-blue-900/30 border-blue-500/50">
              <AlertDescription className="text-blue-200 text-xs">
                🎉 Gasless transaction! You saved on gas fees thanks to Lazorkit!
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
