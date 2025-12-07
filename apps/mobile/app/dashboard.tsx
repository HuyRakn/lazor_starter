import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useLazorAuth, useGaslessTx } from '@lazor-starter/core';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Text, Alert, AlertDescription } from '@lazor-starter/ui';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react-native';
import { useState } from 'react';

export default function DashboardScreen() {
  const router = useRouter();
  const { pubkey, logout } = useLazorAuth();
  const { transferSOL } = useGaslessTx();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!pubkey) {
    router.replace('/');
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
    router.replace('/');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="h1" className="text-3xl font-bold text-white">Dashboard</Text>
        <Button
          onPress={handleLogout}
          variant="outline"
          className="bg-gray-700 border-gray-600"
        >
          <Text>Logout</Text>
        </Button>
      </View>

      <Card className="bg-gray-900 border-gray-800 mx-5 mb-5">
        <CardHeader>
          <CardTitle className="text-sm text-gray-400">Wallet Address</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-white font-mono text-sm break-all">{pubkey}</Text>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800 mx-5 mb-5">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Transfer SOL (Gasless)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <View className="space-y-2">
            <Label className="text-gray-400">Recipient Address</Label>
            <Input
              value={recipient}
              onChangeText={setRecipient}
              placeholder="Enter Solana address"
              autoCapitalize="none"
              autoCorrect={false}
              className="bg-gray-800 border-gray-700 text-white"
            />
          </View>

          <View className="space-y-2">
            <Label className="text-gray-400">Amount (SOL)</Label>
            <Input
              value={amount}
              onChangeText={setAmount}
              placeholder="0.0"
              keyboardType="decimal-pad"
              className="bg-gray-800 border-gray-700 text-white"
            />
          </View>

          <Button
            onPress={handleTransferSOL}
            disabled={loading || !recipient || !amount}
            className="w-full bg-green-600"
          >
            <Text>{loading ? 'Sending...' : 'Send SOL (Gasless)'}</Text>
          </Button>

          {error && (
            <Alert variant="destructive" icon={AlertCircle} className="bg-red-900/50 border-red-500">
              <AlertDescription className="text-red-200 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert icon={CheckCircle2} className="bg-green-900/50 border-green-500">
              <AlertDescription className="text-green-200 text-sm">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Alert icon={Info} className="bg-blue-900/30 border-blue-500/50">
            <AlertDescription className="text-blue-200 text-xs">
              🎉 Gasless transaction! You saved on gas fees thanks to Lazorkit!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
});
